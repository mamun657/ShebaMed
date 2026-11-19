import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { db, setup, connection } from "../lib/db";
import { register, recover } from "../lib/auth";
import { createSharingCode, requestAccess, decideAccess } from "../lib/access";
import { authorize } from "../lib/security";
const enabled = !!process.env.TEST_MONGODB_URI;
describe.skipIf(!enabled)("Real MongoDB replica-set integration", () => {
  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
    process.env.MONGODB_DB_NAME =
      "shebamed_test_" + randomBytes(6).toString("hex");
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    await setup();
  });
  afterAll(async () => {
    if (enabled) {
      await (await db()).dropDatabase();
      await connection().close();
    }
  });
  const input = {
    name: "Synthetic Patient",
    phone: "01712345678",
    password: "SyntheticStrongPass!",
    confirmPassword: "SyntheticStrongPass!",
    role: "PATIENT",
    consent: true,
  };
  it("enforces duplicate phone uniqueness under concurrent registration", async () => {
    const results = await Promise.allSettled([
      register(input),
      register({ ...input, phone: "+8801712345678" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await (await db()).collection("users").countDocuments()).toBe(1);
  });
  it("consumes recovery codes once and invalidates all sessions", async () => {
    const r = await register({ ...input, phone: "01712345679" });
    const d = await db();
    await d
      .collection("sessions")
      .insertOne({
        userId: r.id,
        tokenHash: "synthetic",
        expiresAt: new Date(Date.now() + 60000),
      });
    await recover(
      "01712345679",
      r.recoveryCodes[0],
      "ChangedSyntheticPassword!",
    );
    expect(
      await d.collection("sessions").countDocuments({ userId: r.id }),
    ).toBe(0);
    await expect(
      recover("01712345679", r.recoveryCodes[0], "ChangedAgainSynthetic!"),
    ).rejects.toThrow();
  });
  it("requires approval, applies selected scope, then rejects revoked and expired grants", async () => {
    const p = await register({ ...input, phone: "01712345680" }),
      dr = await register({
        ...input,
        name: "Synthetic Doctor",
        phone: "01712345681",
        role: "DOCTOR",
        registrationNumber: "DEMO",
        specialization: "General",
        workplace: "Synthetic clinic",
        credentialDetails: "Synthetic credentials",
      });
    const d = await db();
    await d
      .collection("users")
      .updateOne(
        { _id: new ObjectId(dr.id) },
        { $set: { professionalStatus: "APPROVED" } },
      );
    const patient = (await d
        .collection("users")
        .findOne({ _id: new ObjectId(p.id) }))!,
      doctor = (await d
        .collection("users")
        .findOne({ _id: new ObjectId(dr.id) }))!;
    const record = await d
      .collection("medical_documents")
      .insertOne({ patientId: p.id, category: "LAB" });
    const selected = { _id: record.insertedId, category: "LAB" };
    const { code } = await createSharingCode(patient);
    await requestAccess(doctor, code);
    await expect(requestAccess(doctor, code)).rejects.toThrow();
    await expect(
      authorize(doctor, p.id, "READ_RECORDS", selected),
    ).rejects.toThrow();
    const request = (await d
      .collection("doctor_access_requests")
      .findOne({ patientId: p.id }))!;
    await decideAccess(patient, {
      requestId: String(request._id),
      decision: "APPROVE",
      minutes: 30,
      scope: "SELECTED",
      documentIds: [String(record.insertedId)],
      capabilities: ["READ_RECORDS"],
    });
    await expect(
      authorize(doctor, p.id, "READ_RECORDS", selected),
    ).resolves.toBeUndefined();
    await expect(
      authorize(doctor, p.id, "READ_RECORDS", {
        _id: new ObjectId(),
        category: "LAB",
      }),
    ).rejects.toThrow();
    await expect(
      authorize(doctor, p.id, "CREATE_OUTPATIENT_ENCOUNTER"),
    ).rejects.toThrow();
    await d
      .collection("doctor_access_grants")
      .updateMany({ patientId: p.id }, { $set: { revokedAt: new Date() } });
    await expect(
      authorize(doctor, p.id, "READ_RECORDS", selected),
    ).rejects.toThrow();
    await d
      .collection("doctor_access_grants")
      .updateMany(
        { patientId: p.id },
        { $set: { revokedAt: null, expiresAt: new Date(0) } },
      );
    await expect(
      authorize(doctor, p.id, "READ_RECORDS", selected),
    ).rejects.toThrow();
  });
});
