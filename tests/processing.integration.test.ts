import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { createCanvas } from "@napi-rs/canvas";
import { db, setup, connection } from "../lib/db";
import {
  storeDocument,
  processNext,
  claimJob,
  expireStaleJobs,
  retryDocument,
  workerStatus,
  enrichWithAi,
  deterministicExtraction,
  extractPages,
} from "../lib/processing";

const enabled = !!process.env.TEST_MONGODB_URI;
const patientId = new ObjectId().toHexString();

// Synthetic prescription: invented medicine names, no real person.
const lines = [
  "SYNTHETIC TEST CLINIC",
  "Dr. Test Physician",
  "Date: 12/10/2026",
  "Rx",
  "Demozol 500 mg 1+0+1 7 days",
  "Fakecillin 250 mg 1+1+1 5 days",
];
function prescriptionImage(rotate = false, variant = 0) {
  const canvas = createCanvas(1000, 700);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 1000, 700);
  context.fillStyle = "#111";
  context.font = "34px sans-serif";
  lines.forEach((line, index) => context.fillText(line, 60, 90 + index * 70));
  // A different corner pixel gives each test its own content hash.
  context.fillStyle = `rgb(${variant},0,0)`;
  context.fillRect(0, 0, 2, 2);
  if (!rotate) return canvas.toBuffer("image/png");
  const turned = createCanvas(700, 1000);
  const turnedContext = turned.getContext("2d");
  turnedContext.translate(700, 0);
  turnedContext.rotate(Math.PI / 2);
  turnedContext.drawImage(canvas, 0, 0);
  return turned.toBuffer("image/png");
}

describe.skipIf(!enabled)("Document processing lifecycle", () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
    process.env.MONGODB_DB_NAME =
      "shebamed_test_" + randomBytes(6).toString("hex");
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_VISION_MODEL;
    await setup();
  });
  afterAll(async () => {
    if (enabled) {
      await (await db()).dropDatabase();
      await connection().close();
    }
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GROQ_API_KEY;
  });

  const documents = async () => (await db()).collection("medical_documents");
  const jobs = async () => (await db()).collection("processing_jobs");
  const jobOf = async (id: string) =>
    (await jobs()).findOne({ documentId: id });
  const docOf = async (id: string) =>
    (await documents()).findOne({ _id: new ObjectId(id) });

  it("queues an upload, processes it once and stores the text", async () => {
    const id = String(
      await storeDocument(
        prescriptionImage(),
        "synthetic.png",
        patientId,
        patientId,
      ),
    );
    expect((await docOf(id))!.status).toBe("QUEUED");
    expect(await (await jobs()).countDocuments({ documentId: id })).toBe(1);
    expect((await jobOf(id))!.status).toBe("QUEUED");

    expect(await processNext("test-worker")).toBe(true);
    const done = (await docOf(id))!;
    expect(["NEEDS_REVIEW", "COMPLETED"]).toContain(done.status);
    expect(done.pageCount).toBe(1);
    expect(done.pageTexts[0].method).toBe("IMAGE_OCR");
    expect(done.pageTexts[0].text).toContain("Demozol 500 mg");
    expect(done.processingStartedAt).toBeInstanceOf(Date);
    expect((await jobOf(id))!.status).toBe("COMPLETED");
    expect(await processNext("test-worker")).toBe(false);
  });

  it("gives one job to only one of two workers", async () => {
    const id = String(
      await storeDocument(
        prescriptionImage(false, 1),
        "race.png",
        patientId,
        patientId,
      ),
    );
    const claims = await Promise.all([claimJob("a"), claimJob("b")]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect((await jobOf(id))!.attempts).toBe(1);
    await (
      await jobs()
    ).updateOne({ documentId: id }, { $set: { status: "COMPLETED" } });
  });

  it("recovers a job abandoned by a killed worker, without duplicates", async () => {
    const id = String(
      await storeDocument(
        prescriptionImage(false, 2),
        "killed.png",
        patientId,
        patientId,
      ),
    );
    await claimJob("dead-worker");
    await (
      await jobs()
    ).updateOne(
      { documentId: id },
      { $set: { lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000) } },
    );
    expect(await expireStaleJobs()).toBe(1);
    expect((await jobOf(id))!.status).toBe("QUEUED");
    expect((await docOf(id))!.status).toBe("QUEUED");

    expect(await processNext("new-worker")).toBe(true);
    expect((await jobOf(id))!).toMatchObject({
      status: "COMPLETED",
      attempts: 2,
    });
    const d = await db();
    expect(
      await d.collection("document_chunks").countDocuments({ documentId: id }),
    ).toBe(1);
    expect(await (await jobs()).countDocuments({ documentId: id })).toBe(1);
  });

  it("fails for good after the attempt limit, then retries on request", async () => {
    const id = String(
      await storeDocument(
        prescriptionImage(false, 3),
        "limit.png",
        patientId,
        patientId,
      ),
    );
    await (
      await jobs()
    ).updateOne(
      { documentId: id },
      {
        $set: {
          status: "PROCESSING",
          attempts: 4,
          leaseUntil: new Date(0),
          lastHeartbeatAt: new Date(0),
        },
      },
    );
    await expireStaleJobs();
    expect((await docOf(id))!).toMatchObject({
      status: "FAILED",
      extractionState: "FAILED",
    });
    expect(await processNext("test-worker")).toBe(false);

    await retryDocument(id, patientId);
    expect((await jobOf(id))!).toMatchObject({ status: "QUEUED", attempts: 0 });
    await expect(retryDocument(id, patientId)).rejects.toThrow(
      /already queued/,
    );
    expect(await (await jobs()).countDocuments({ documentId: id })).toBe(1);
    expect(await processNext("test-worker")).toBe(true);
    expect((await jobOf(id))!.status).toBe("COMPLETED");
  });

  it("stores a sanitized failure when the file cannot be read", async () => {
    const id = String(
      await storeDocument(
        prescriptionImage(false, 4),
        "broken.png",
        patientId,
        patientId,
      ),
    );
    await (
      await documents()
    ).updateOne(
      { _id: new ObjectId(id) },
      { $set: { fileId: new ObjectId() } },
    );
    for (let attempt = 0; attempt < 4; attempt++)
      await processNext("test-worker");
    const failed = (await docOf(id))!;
    expect(failed.status).toBe("FAILED");
    expect(failed.extractionState).toBe("FAILED");
    expect(failed.attempts).toBeLessThanOrEqual(4);
    expect(String(failed.error)).not.toMatch(/mongodb|gridfs|at\s+\S+\s+\(/i);
    expect(await processNext("test-worker")).toBe(false);
  });

  it("reports whether a worker is alive", async () => {
    const d = await db();
    await d.collection("worker_heartbeats").deleteMany({});
    expect((await workerStatus()).online).toBe(false);
    await d.collection("worker_heartbeats").insertOne({
      workerId: "old",
      status: "RUNNING",
      lastSeenAt: new Date(Date.now() - 5 * 60 * 1000),
    });
    expect((await workerStatus()).online).toBe(false);
    await d.collection("worker_heartbeats").insertOne({
      workerId: "live",
      status: "RUNNING",
      lastSeenAt: new Date(),
    });
    expect((await workerStatus()).online).toBe(true);
  });

  it("reads a photo that was taken sideways", async () => {
    const [page] = await extractPages(prescriptionImage(true), "image/png");
    expect(page.text).toContain("Fakecillin 250 mg");
    expect(page.confidence).toBeGreaterThan(60);
  });

  it("discards a medicine the AI model made up", async () => {
    process.env.GROQ_API_KEY = "synthetic-key";
    process.env.GROQ_TEXT_MODEL = "synthetic-model";
    const reply = {
      title: "Prescription",
      category: "PRESCRIPTION",
      reportDate: "2026-10-12",
      laboratory: null,
      hospital: "SYNTHETIC TEST CLINIC",
      observations: [],
      medications: ["Inventamycin 500 mg"],
      diagnoses: [],
      prescription: {
        prescriber: "Dr. Test Physician",
        medicines: [
          {
            name: "Demozol",
            strength: "500 mg",
            frequency: "1+0+1",
            duration: "7 days",
          },
          { name: "Inventamycin", strength: "500 mg", frequency: "1+0+1" },
        ],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: JSON.stringify(reply) } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      ),
    );
    const pages = [
      {
        page: 1,
        text: lines.join("\n"),
        method: "IMAGE_OCR" as const,
        confidence: 90,
      },
    ];
    const result = await enrichWithAi(pages, deterministicExtraction(pages));
    expect(result.prescription!.medicines.map((m) => m.name)).toEqual([
      "Demozol",
    ]);
    expect(result.prescription!.unreadable).toBe(1);
  });
});
