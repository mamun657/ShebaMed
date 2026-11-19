import { test, expect, devices, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("synthetic patient-pharmacy consent and workspace workflow", async ({
  playwright,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(120000);
  test.skip(
    !process.env.E2E_ADMIN_PHONE || !process.env.E2E_ADMIN_PASSWORD,
    "Configure a disposable test database and E2E administrator credentials",
  );
  const origin = new URL(baseURL!).origin;
  const contexts: APIRequestContext[] = [];
  const context = async () => {
    const result = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { origin },
    });
    contexts.push(result);
    return result;
  };
  const patient = await context();
  const pharmacy = await context();
  const admin = await context();
  const suffix = String(Date.now()).slice(-8);
  const patientIdFromPhone = "017" + suffix;
  const pharmacyPhone = "018" + suffix;
  const password = "SyntheticPharmacyWorkflowPassword!";
  const post = (client: APIRequestContext, path: string, data: unknown) =>
    client.post("/api/" + path, { data });

  try {
    const patientRegistration = await post(patient, "auth/register", {
      name: "Synthetic Pharmacy Patient",
      phone: patientIdFromPhone,
      password,
      confirmPassword: password,
      role: "PATIENT",
      consent: true,
    });
    expect(patientRegistration.status()).toBe(201);
    const patientId = (await patientRegistration.json()).id as string;
    const pharmacyRegistration = await post(pharmacy, "auth/register", {
      name: "Synthetic Pharmacy Staff",
      phone: pharmacyPhone,
      password,
      confirmPassword: password,
      role: "PHARMACY",
      consent: true,
      pharmacyName: "Synthetic Community Pharmacy",
      registrationNumber: "SYNTH-PH-" + suffix,
      address: "Synthetic District",
      credentialDetails: "Synthetic registration details",
    });
    expect(pharmacyRegistration.status()).toBe(201);
    const pharmacyId = (await pharmacyRegistration.json()).id as string;
    await post(pharmacy, "auth/logout", {});
    expect(
      (
        await post(pharmacy, "auth/login", {
          phone: pharmacyPhone,
          password,
        })
      ).ok(),
    ).toBe(true);

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
        await post(admin, "admin/pharmacy-review", {
          id: pharmacyId,
          decision: "APPROVED",
        })
      ).ok(),
    ).toBe(true);
    const dashboard = await pharmacy.get("/pharmacy/dashboard");
    expect(dashboard.status()).toBe(200);
    expect(await dashboard.text()).toContain("PHARMACY WORKSPACE");
    expect(
      (await pharmacy.get("/api/records?patientId=" + patientId)).status(),
    ).toBe(403);
    expect(
      (
        await post(pharmacy, "encounters?patientId=" + patientId, {})
      ).status(),
    ).toBe(403);

    const createCode = async () =>
      (await (await post(patient, "access/code", {})).json()).code as string;
    const requestWithCode = async () =>
      post(pharmacy, "access/request", { code: await createCode() });
    expect((await requestWithCode()).ok()).toBe(true);
    let access = await (await patient.get("/api/access")).json();
    let request = access.requests.find(
      (item: { providerRole?: string; status: string }) =>
        item.providerRole === "PHARMACY" && item.status === "PENDING",
    );
    expect(
      (
        await post(patient, "access/decision", {
          requestId: request._id,
          decision: "REJECT",
          minutes: 30,
          scope: "ALL",
          documentIds: [],
          capabilities: ["READ_RECORDS"],
        })
      ).ok(),
    ).toBe(true);

    expect((await requestWithCode()).ok()).toBe(true);
    access = await (await patient.get("/api/access")).json();
    request = access.requests.find(
      (item: { providerRole?: string; status: string }) =>
        item.providerRole === "PHARMACY" && item.status === "PENDING",
    );
    const pharmacyCapabilities = [
      "READ_RECORDS",
      "QUERY_MEDICAL_HISTORY",
      "UPLOAD_PHARMACY_DOCUMENT",
      "CREATE_PHARMACY_ENCOUNTER",
      "RECORD_MEDICINE_DISPENSING",
    ];
    const approveRequest = async () =>
      post(patient, "access/decision", {
        requestId: request._id,
        decision: "APPROVE",
        minutes: 60,
        scope: "ALL",
        documentIds: [],
        capabilities: pharmacyCapabilities,
      });
    expect((await approveRequest()).ok()).toBe(true);

    expect(
      (
        await post(admin, "admin/pharmacy-review", {
          id: pharmacyId,
          decision: "REJECTED",
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await pharmacy.get("/api/records?patientId=" + patientId)).status(),
    ).toBe(403);
    expect(
      (
        await post(admin, "admin/pharmacy-review", {
          id: pharmacyId,
          decision: "APPROVED",
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await pharmacy.get("/api/records?patientId=" + patientId)).status(),
    ).toBe(403);

    expect((await requestWithCode()).ok()).toBe(true);
    access = await (await patient.get("/api/access")).json();
    request = access.requests.find(
      (item: { providerRole?: string; status: string }) =>
        item.providerRole === "PHARMACY" && item.status === "PENDING",
    );
    expect((await approveRequest()).ok()).toBe(true);

    const upload = await pharmacy.post(
      "/api/records/upload?patientId=" + patientId,
      {
        multipart: {
          file: {
            name: "synthetic-pharmacy-report.pdf",
            mimeType: "application/pdf",
            buffer: await readFile("demo/synthetic-hba1c.pdf"),
          },
        },
      },
    );
    expect(upload.status()).toBe(201);
    const uploadedId = (await upload.json()).id as string;
    const uploaded = (
      await (await patient.get("/api/records/" + uploadedId)).json()
    ).record;
    expect(uploaded.documentSource).toBe("PHARMACY_UPLOAD");
    expect(uploaded.organizationName).toBe("Synthetic Community Pharmacy");
    expect(uploaded.verification).not.toBe("CLINICIAN_VERIFIED");

    const encounterResponse = await post(
      pharmacy,
      "pharmacy/encounters?patientId=" + patientId,
      {
        visitDate: "2026-11-19",
        patientReportedConcern: "Synthetic concern " + suffix,
        relevantHistoryReviewed: "Synthetic report reviewed " + suffix,
        guidanceOrService: "Synthetic basic guidance " + suffix,
        doctorReferralRecommended: "YES",
        notes: "Synthetic notes " + suffix,
      },
    );
    expect(encounterResponse.status()).toBe(201);
    const encounterId = (await encounterResponse.json()).id as string;
    const savedEncounter = (
      await (await patient.get("/api/records/" + encounterId)).json()
    ).record;
    expect(savedEncounter).toMatchObject({
      category: "PHARMACY_ENCOUNTER",
      status: "COMPLETED",
      verification: "UNREVIEWED",
      documentSource: "PHARMACY_ENCOUNTER",
      organizationName: "Synthetic Community Pharmacy",
      uploadedByStaffName: "Synthetic Pharmacy Staff",
      pharmacyEncounter: {
        visitDate: "2026-11-19",
        patientReportedConcern: "Synthetic concern " + suffix,
        relevantHistoryReviewed: "Synthetic report reviewed " + suffix,
        guidanceOrService: "Synthetic basic guidance " + suffix,
        doctorReferralRecommended: "YES",
        notes: "Synthetic notes " + suffix,
        pharmacyName: "Synthetic Community Pharmacy",
        staffName: "Synthetic Pharmacy Staff",
      },
    });
    expect(savedEncounter.fileId).toBeUndefined();
    expect(savedEncounter.extractionState).toBeUndefined();

    const dispensingResponse = await post(
      pharmacy,
      "pharmacy/dispensing?patientId=" + patientId,
      {
        medicineName: "Synthetic medicine " + suffix,
        activeIngredient: "Synthetic ingredient",
        activeIngredientVerified: true,
        strength: "10 mg",
        quantitySupplied: "10 tablets",
        dispensingDate: "2026-11-19",
        prescriptionReference: "SYNTH-RX-001",
      },
    );
    expect(dispensingResponse.status()).toBe(201);
    const dispensingId = (await dispensingResponse.json()).id as string;

    const doctor = await context();
    const doctorRegistration = await post(doctor, "auth/register", {
      name: "Synthetic Regression Doctor",
      phone: "019" + suffix,
      password,
      confirmPassword: password,
      role: "DOCTOR",
      consent: true,
      registrationNumber: "SYNTH-DR-" + suffix,
      specialization: "Synthetic general care",
      workplace: "Synthetic clinic",
      credentialDetails: "Synthetic doctor regression profile",
    });
    expect(doctorRegistration.status()).toBe(201);
    const doctorId = (await doctorRegistration.json()).id as string;
    expect(
      (
        await post(admin, "admin/review", {
          id: doctorId,
          decision: "APPROVED",
        })
      ).ok(),
    ).toBe(true);
    const doctorCode = (
      await (await post(patient, "access/code", {})).json()
    ).code as string;
    expect(
      (await post(doctor, "access/request", { code: doctorCode })).ok(),
    ).toBe(true);
    access = await (await patient.get("/api/access")).json();
    const doctorRequest = access.requests.find(
      (item: { providerRole?: string; status: string }) =>
        item.providerRole === "DOCTOR" && item.status === "PENDING",
    );
    expect(
      (
        await post(patient, "access/decision", {
          requestId: doctorRequest._id,
          decision: "APPROVE",
          minutes: 60,
          scope: "ALL",
          documentIds: [],
          capabilities: ["READ_RECORDS", "CREATE_OUTPATIENT_ENCOUNTER"],
        })
      ).ok(),
    ).toBe(true);
    const doctorEncounterResponse = await post(
      doctor,
      "encounters?patientId=" + patientId,
      {
        date: "2026-11-18",
        organization: "Synthetic clinic",
        chiefComplaint: "Synthetic doctor follow-up",
        notes: "Synthetic doctor-authored regression note",
        history: "Synthetic historical review",
        diagnosis: "Synthetic test diagnosis",
        testOrders: "None",
        followUp: "Synthetic follow-up",
      },
    );
    expect(doctorEncounterResponse.status()).toBe(201);
    const patientRecords = (
      await (
        await patient.get("/api/records?patientId=" + patientId)
      ).json()
    ).records;
    const doctorEncounter = patientRecords.find(
      (record: { encounter?: { chiefComplaint?: string } }) =>
        record.encounter?.chiefComplaint === "Synthetic doctor follow-up",
    );
    expect(doctorEncounter).toMatchObject({
      category: "CLINICAL_NOTE",
      verification: "CLINICIAN_AUTHORED",
      encounter: {
        chiefComplaint: "Synthetic doctor follow-up",
        diagnosis: "Synthetic test diagnosis",
      },
    });
    expect(doctorEncounter.pharmacyEncounter).toBeUndefined();

    const records = patientRecords;
    expect(
      records.some(
        (record: { category: string }) =>
          record.category === "PHARMACY_ENCOUNTER",
      ),
    ).toBe(true);
    expect(
      records.filter(
        (record: { category: string }) =>
          record.category === "PHARMACY_ENCOUNTER",
      ),
    ).toHaveLength(1);
    expect(
      records.some(
        (record: { category: string }) =>
          record.category === "MEDICINE_DISPENSING",
      ),
    ).toBe(true);

    const aiResponse = await post(
      pharmacy,
      "ai?patientId=" + patientId,
      {
        question: "Was Synthetic medicine " + suffix + " previously dispensed?",
        language: "English",
      },
    );
    expect(aiResponse.status()).toBe(200);
    const aiAnswer = await aiResponse.json();
    expect(
      aiAnswer.sources.some(
        (source: { documentId: string; url: string }) =>
          source.documentId === dispensingId &&
          source.url.includes(`/pharmacy/records/${dispensingId}?patientId=`),
      ),
    ).toBe(true);

    const patientBrowser = await browser.newContext({
      baseURL,
      storageState: await patient.storageState(),
      viewport:
        testInfo.project.name === "mobile"
          ? devices["Pixel 7"].viewport
          : devices["Desktop Chrome"].viewport,
    });
    try {
      const page = await patientBrowser.newPage();
      await page.goto("/patient/records/" + encounterId);
      await expect(
        page.getByText("Digital Pharmacy Record — No OCR required"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Pharmacy Assistance Encounter",
        }),
      ).toBeVisible();
      for (const text of [
        "Pharmacy organization",
        "Synthetic Community Pharmacy",
        "Staff member",
        "Synthetic Pharmacy Staff",
        "Visit date",
        "Patient-reported concern",
        "Synthetic concern " + suffix,
        "Relevant history reviewed",
        "Synthetic report reviewed " + suffix,
        "Basic guidance or service provided",
        "Synthetic basic guidance " + suffix,
        "Doctor referral recommended",
        "Additional notes",
        "Synthetic notes " + suffix,
        "Recorded",
        "Not clinician-verified",
        "Record creation timestamp",
        "Review / verification status",
        "not verified by a doctor",
      ])
        await expect(page.getByText(text, { exact: false })).toBeVisible();
      await expect(
        page.getByText("19 Nov 2026", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Yes", { exact: true })).toBeVisible();
      await expect(
        page.getByText("The worker has not finished reading this document."),
      ).toHaveCount(0);
      await expect(page.getByText("Original document", { exact: true })).toHaveCount(0);
      await expect(
        page.getByText("patientreportedconcern", { exact: false }),
      ).toHaveCount(0);

      await page.goto("/patient/timeline");
      await expect(
        page.getByText("Pharmacy Assistance Encounter", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Recorded by Synthetic Pharmacy Staff", {
          exact: false,
        }),
      ).toBeVisible();

    } finally {
      await patientBrowser.close();
    }
    const pharmacyBrowser = await browser.newContext({
      baseURL,
      storageState: await pharmacy.storageState(),
      viewport:
        testInfo.project.name === "mobile"
          ? devices["Pixel 7"].viewport
          : devices["Desktop Chrome"].viewport,
    });
    try {
      const page = await pharmacyBrowser.newPage();
      await page.goto(
        `/pharmacy/records/${dispensingId}?patientId=${encodeURIComponent(patientId)}`,
      );
      await expect(
        page.getByText("Digital Pharmacy Record — No OCR required"),
      ).toBeVisible();
      await expect(
        page.getByText("Synthetic medicine " + suffix),
      ).toBeVisible();
      await page.goto(
        `/pharmacy/encounters?patientId=${encodeURIComponent(patientId)}`,
      );
      for (const name of [
        "Authorized medical history",
        "AI Medical Assistant",
        "Upload medical document",
        "Record medicine dispensing",
      ])
        await expect(
          page.locator(".quick-actions").getByRole("link", {
            name: new RegExp(name),
          }),
        ).toBeVisible();
    } finally {
      await pharmacyBrowser.close();
    }

    expect(
      (
        await post(pharmacy, "encounters?patientId=" + patientId, {})
      ).status(),
    ).toBe(403);

    access = await (await patient.get("/api/access")).json();
    const grant = access.grants.find(
      (item: { providerRole?: string }) => item.providerRole === "PHARMACY",
    );
    expect(
      (await post(patient, "access/revoke", { id: grant._id })).ok(),
    ).toBe(true);
    expect(
      (await pharmacy.get("/api/records?patientId=" + patientId)).status(),
    ).toBe(403);
    expect(
      (
        await post(pharmacy, "ai?patientId=" + patientId, {
          question:
            "Was Synthetic medicine " + suffix + " previously dispensed?",
          language: "English",
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(pharmacy, "pharmacy/dispensing?patientId=" + patientId, {
          medicineName: "Synthetic medicine",
          quantitySupplied: "1",
          dispensingDate: "2026-11-19",
        })
      ).status(),
    ).toBe(403);
  } finally {
    for (const client of contexts) await client.dispose();
  }
});
