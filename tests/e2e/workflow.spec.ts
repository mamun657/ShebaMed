import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("synthetic patient-doctor authorization workflow", async ({
  playwright,
  baseURL,
}) => {
  test.skip(
    !process.env.E2E_ADMIN_PHONE || !process.env.E2E_ADMIN_PASSWORD,
    "Configure a disposable test database and E2E administrator credentials",
  );
  const origin = new URL(baseURL!).origin;
  const contexts: APIRequestContext[] = [];
  const context = async () => {
    const c = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { origin },
    });
    contexts.push(c);
    return c;
  };
  const patient = await context(),
    doctor = await context(),
    admin = await context();
  const phone = "018" + String(Date.now()).slice(-8),
    doctorPhone = "019" + String(Date.now()).slice(-8);
  const password = "SyntheticWorkflowPassword!";
  const post = (c: APIRequestContext, path: string, data: unknown) =>
    c.post("/api/" + path, { data });
  try {
    let response = await post(patient, "auth/register", {
      name: "Synthetic Workflow Patient",
      phone,
      password,
      confirmPassword: password,
      role: "PATIENT",
      consent: true,
    });
    expect(response.status()).toBe(201);
    const patientId = (await response.json()).id;
    response = await post(doctor, "auth/register", {
      name: "Synthetic Workflow Doctor",
      phone: doctorPhone,
      password,
      confirmPassword: password,
      role: "DOCTOR",
      consent: true,
      registrationNumber: "DEMO-NOT-REAL",
      specialization: "Demonstration",
      workplace: "Fictional Clinic",
      credentialDetails: "Synthetic credentials",
    });
    expect(response.status()).toBe(201);
    const doctorId = (await response.json()).id;
    const duplicate = await context();
    expect(
      (
        await post(duplicate, "auth/register", {
          name: "Duplicate Synthetic",
          phone: "+88" + phone,
          password,
          confirmPassword: password,
          role: "PATIENT",
          consent: true,
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await post(doctor, "access/request", {
          code: "invalid-code-for-testing",
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(admin, "auth/login", {
          phone: process.env.E2E_ADMIN_PHONE,
          password: process.env.E2E_ADMIN_PASSWORD,
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await post(admin, "admin/review", {
          id: doctorId,
          decision: "APPROVED",
        })
      ).ok(),
    ).toBe(true);
    const bytes = await readFile("demo/synthetic-hba1c.pdf");
    response = await patient.post("/api/records/upload", {
      multipart: {
        file: {
          name: "synthetic-hba1c.pdf",
          mimeType: "application/pdf",
          buffer: bytes,
        },
      },
    });
    expect(response.status()).toBe(201);
    const documentId = (await response.json()).id;
    expect(
      (await admin.get("/api/records?patientId=" + patientId)).status(),
    ).toBe(403);
    const code = (await (await post(patient, "access/code", {})).json()).code;
    expect((await post(doctor, "access/request", { code })).ok()).toBe(true);
    expect(
      (await doctor.get("/api/records/" + documentId + "/file")).status(),
    ).toBe(403);
    const requests = (await (await patient.get("/api/access")).json()).requests;
    expect(
      (
        await post(patient, "access/decision", {
          requestId: requests[0]._id,
          decision: "APPROVE",
          minutes: 30,
          scope: "SELECTED",
          documentIds: [documentId],
          capabilities: ["READ_RECORDS", "QUERY_MEDICAL_HISTORY"],
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await doctor.get("/api/records/" + documentId + "/file")).ok(),
    ).toBe(true);
    expect(
      (await post(doctor, "encounters?patientId=" + patientId, {})).status(),
    ).toBe(403);
    const grants = (await (await patient.get("/api/access")).json()).grants;
    expect(
      (await post(patient, "access/revoke", { id: grants[0]._id })).ok(),
    ).toBe(true);
    expect(
      (await doctor.get("/api/records/" + documentId + "/file")).status(),
    ).toBe(403);
    expect(
      (
        await post(doctor, "ai?patientId=" + patientId, {
          question: "Have I done an HbA1c test before?",
          language: "English",
        })
      ).status(),
    ).toBe(403);
    const secondCode = (await (await post(patient, "access/code", {})).json())
      .code;
    await post(doctor, "access/request", { code: secondCode });
    const secondRequest = (
      await (await patient.get("/api/access")).json()
    ).requests.find((r: { status: string }) => r.status === "PENDING");
    await post(patient, "access/decision", {
      requestId: secondRequest._id,
      decision: "APPROVE",
      minutes: 60,
      scope: "ALL",
      documentIds: [],
      capabilities: ["READ_RECORDS", "CREATE_OUTPATIENT_ENCOUNTER"],
    });
    expect(
      (
        await post(doctor, "encounters?patientId=" + patientId, {
          date: "2026-01-15",
          organization: "Synthetic Clinic",
          chiefComplaint: "Synthetic follow-up",
          notes: "Not a real clinical record.",
          history: "Demo",
          diagnosis: "Not documented",
          testOrders: "Not documented",
          followUp: "Demo only",
        })
      ).status(),
    ).toBe(201);
    if (process.env.E2E_LIVE_AI === "1") {
      await expect
        .poll(
          async () => {
            const r = await patient.get("/api/records/" + documentId);
            return (await r.json()).record.status;
          },
          { timeout: 120000, intervals: [2000, 5000] },
        )
        .toBe("NEEDS_REVIEW");
      const record = (
        await (await patient.get("/api/records/" + documentId)).json()
      ).record;
      expect(
        (
          await post(
            patient,
            "records/" + documentId + "/review",
            record.extracted,
          )
        ).ok(),
      ).toBe(true);
      const ai = await post(patient, "ai", {
        question: "Have I done an HbA1c test before?",
        language: "English",
      });
      expect(ai.ok()).toBe(true);
      expect((await ai.json()).sources.length).toBeGreaterThan(0);
    }
  } finally {
    for (const c of contexts) await c.dispose();
  }
});
