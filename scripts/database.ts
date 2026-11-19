import { readFile } from "node:fs/promises";
import argon2 from "argon2";
import { db, setup, connection, ConfigurationError } from "../lib/db";
import { register } from "../lib/auth";
import { normalizePhone, passwordSchema, userId } from "../lib/security";
import { storeDocument } from "../lib/processing";
const command = process.argv[2];
try {
  const d = await db();
  if (command === "check") {
    await d.command({ ping: 1 });
    console.log("MongoDB ping succeeded");
  } else if (command === "setup") {
    await setup();
    console.log("Collections and indexes initialized");
  } else if (command === "admin") {
    await setup();
    const password = passwordSchema.parse(process.env.ADMIN_PASSWORD);
    const phone = normalizePhone(process.env.ADMIN_PHONE || "");
    if (!process.env.ADMIN_NAME) throw new Error("Set ADMIN_NAME");
    if (await d.collection("users").findOne({ phoneE164: phone }))
      throw new Error("Account already exists; setup does not overwrite it");
    await d
      .collection("users")
      .insertOne({
        name: process.env.ADMIN_NAME,
        phoneE164: phone,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        role: "ADMIN",
        shebamedId: userId("ADMIN"),
        status: "ACTIVE",
        phoneOwnership: "UNVERIFIED",
        createdAt: new Date(),
      });
    console.log(
      "Administrator created. Keep provisioning credentials private.",
    );
  } else if (command === "seed") {
    if (process.env.NODE_ENV === "production")
      throw new Error("Demo seeding is disabled in production");
    await setup();
    const password = passwordSchema.parse(process.env.DEMO_PASSWORD);
    const definitions = [
      ["Demo Rahim Ahmed", "01700000001", "PATIENT"],
      ["Demo Nusrat Jahan", "01700000002", "PATIENT"],
      ["Demo Dr Tanvir Hasan", "01700000003", "DOCTOR"],
      ["Demo Dr Sadiya Rahman", "01700000004", "DOCTOR"],
    ];
    const ids: string[] = [];
    for (const [name, phone, role] of definitions) {
      const existing = await d
        .collection("users")
        .findOne({ phoneE164: normalizePhone(phone) });
      if (existing) {
        if (!existing.demo)
          throw new Error(
            "Seed phone belongs to a non-demo account; refusing to modify it",
          );
        ids.push(String(existing._id));
        continue;
      }
      const r = await register({
        name,
        phone,
        role,
        password,
        confirmPassword: password,
        consent: true,
        ...(role === "DOCTOR"
          ? {
              registrationNumber: "DEMO-NOT-A-REAL-LICENSE",
              specialization: "General medicine",
              workplace: "Fictional Demonstration Clinic",
              credentialDetails: "Synthetic profile for testing only",
            }
          : {}),
      });
      ids.push(r.id);
      const { ObjectId } = await import("mongodb");
      await d
        .collection("users")
        .updateOne(
          { _id: new ObjectId(r.id) },
          {
            $set: {
              demo: true,
              ...(phone === "01700000003"
                ? { professionalStatus: "APPROVED" }
                : {}),
            },
          },
        );
    }
    for (const file of [
      "synthetic-hba1c.pdf",
      "synthetic-cbc.png",
      "synthetic-prescription-scanned.pdf",
    ]) {
      if (
        !(await d
          .collection("medical_documents")
          .findOne({ patientId: ids[0], filename: file }))
      )
        await storeDocument(
          await readFile(new URL("../demo/" + file, import.meta.url)),
          file,
          ids[0],
          ids[0],
        );
    }
    if (
      !(await d.collection("doctor_access_requests").findOne({ demo: true }))
    ) {
      await d
        .collection("doctor_access_requests")
        .insertOne({
          patientId: ids[0],
          doctorId: ids[2],
          doctorName: definitions[2][0],
          doctorShebamedId: (
            await d
              .collection("users")
              .findOne({ phoneE164: normalizePhone(definitions[2][1]) })
          )?.shebamedId,
          status: "PENDING",
          demo: true,
          createdAt: new Date(),
        });
      for (const minutes of [30, 60])
        await d
          .collection("doctor_access_grants")
          .insertOne({
            patientId: minutes === 30 ? ids[0] : ids[1],
            doctorId: ids[2],
            doctorName: definitions[2][0],
            scope: "ALL",
            documentIds: [],
            capabilities: [
              "READ_RECORDS",
              "QUERY_MEDICAL_HISTORY",
              "CREATE_OUTPATIENT_ENCOUNTER",
              "ADD_CLINICAL_DOCUMENT",
            ],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + minutes * 60000),
            revokedAt: null,
            demo: true,
          });
      const encounter = {
        date: "2026-01-15",
        organization: "Fictional Demonstration Clinic",
        chiefComplaint: "Synthetic routine follow-up",
        notes: "Fictional encounter for software testing. No treatment advice.",
        history: "Synthetic historical report reviewed.",
        diagnosis: "Not recorded",
        testOrders: "Not recorded",
        followUp: "Demonstration only",
      };
      const result = await d
        .collection("medical_documents")
        .insertOne({
          patientId: ids[0],
          authorId: ids[2],
          authorName: definitions[2][0],
          title: encounter.chiefComplaint,
          filename: "Synthetic clinical encounter",
          category: "CLINICAL_NOTE",
          reportDate: encounter.date,
          status: "COMPLETED",
          verification: "CLINICIAN_AUTHORED",
          encounter,
          createdAt: new Date(),
        });
      await d
        .collection("medical_encounters")
        .insertOne({
          ...encounter,
          patientId: ids[0],
          doctorId: ids[2],
          documentId: String(result.insertedId),
        });
      await d
        .collection("document_chunks")
        .insertOne({
          patientId: ids[0],
          documentId: String(result.insertedId),
          page: 1,
          text: Object.values(encounter).join("\n"),
        });
    }
    console.log(
      "Synthetic demo accounts and fixtures initialized. Use DEMO_PASSWORD. Run admin:create separately and worker for OCR.",
    );
  } else throw new Error("Use check, setup, seed, or admin");
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.error(`${e.message}\n${e.hint}`);
    process.exitCode = 1;
  } else if (e instanceof Error) {
    console.error(`Database operation failed: ${e.message}`);
    process.exitCode = 1;
  } else {
    console.error(
      "Database operation failed. Check environment, network access, replica-set support and account configuration.",
    );
    process.exitCode = 1;
  }
} finally {
  await connection().close();
}
