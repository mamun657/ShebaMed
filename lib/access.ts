import { Document } from "mongodb";
import { z } from "zod";
import { db, connection } from "./db";
import {
  AppError,
  digest,
  randomToken,
  oid,
  audit,
  capabilities,
} from "./security";
export async function createSharingCode(user: Document) {
  if (user.role !== "PATIENT")
    throw new AppError(403, "Patient account required");
  const code = randomToken().slice(0, 16);
  await (
    await db()
  )
    .collection("sharing_codes")
    .insertOne({
      patientId: String(user._id),
      codeHash: digest(code),
      expiresAt: new Date(Date.now() + 10 * 60000),
      usedAt: null,
    });
  return { code, expiresInMinutes: 10 };
}
export async function requestAccess(user: Document, code: string) {
  if (user.role !== "DOCTOR" || user.professionalStatus !== "APPROVED")
    throw new AppError(
      403,
      "Admin review is required before requesting access",
    );
  const d = await db(),
    session = connection().startSession();
  try {
    await session.withTransaction(async () => {
      const row = await d
        .collection("sharing_codes")
        .findOneAndUpdate(
          {
            codeHash: digest(code),
            usedAt: null,
            expiresAt: { $gt: new Date() },
          },
          { $set: { usedAt: new Date() } },
          { session },
        );
      if (!row)
        throw new AppError(
          400,
          "Sharing code is invalid, expired, or already used",
        );
      await d
        .collection("doctor_access_requests")
        .insertOne(
          {
            patientId: row.patientId,
            doctorId: String(user._id),
            doctorName: user.name,
            doctorShebamedId: user.shebamedId,
            status: "PENDING",
            createdAt: new Date(),
          },
          { session },
        );
    });
  } finally {
    await session.endSession();
  }
  await audit(String(user._id), "ACCESS_REQUESTED", String(user._id));
}
export async function requestPharmacyAccess(user: Document, code: string) {
  if (user.role !== "PHARMACY" || user.professionalStatus !== "APPROVED")
    throw new AppError(403, "Admin review is required before requesting access");
  const d = await db(),
    profile = await d
      .collection("pharmacy_profiles")
      .findOne({ userId: String(user._id) });
  if (!profile) throw new AppError(403, "Pharmacy profile is unavailable");
  const session = connection().startSession();
  try {
    await session.withTransaction(async () => {
      const row = await d.collection("sharing_codes").findOneAndUpdate(
        {
          codeHash: digest(code),
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { usedAt: new Date() } },
        { session },
      );
      if (!row)
        throw new AppError(400, "Sharing code is invalid, expired, or already used");
      await d.collection("pharmacy_access_requests").insertOne(
        {
          patientId: row.patientId,
          providerRole: "PHARMACY",
          pharmacyUserId: String(user._id),
          pharmacyId: String(profile._id),
          pharmacyName: profile.pharmacyName,
          pharmacyRegistrationNumber: profile.registrationNumber,
          pharmacyStaffName: user.name,
          pharmacyShebamedId: user.shebamedId,
          status: "PENDING",
          createdAt: new Date(),
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  await audit(String(user._id), "PHARMACY_ACCESS_REQUESTED", String(user._id));
}
export const approvalSchema = z
  .object({
    requestId: z.string(),
    decision: z.enum(["APPROVE", "REJECT"]),
    minutes: z.union([z.literal(30), z.literal(60)]),
    scope: z.enum([
      "ALL",
      "SELECTED",
      "LAB",
      "PRESCRIPTION",
      "CLINICAL_NOTE",
      "PHARMACY_ENCOUNTER",
      "MEDICINE_DISPENSING",
    ]),
    documentIds: z.array(z.string()).max(100).default([]),
    capabilities: z.array(z.enum(capabilities)).min(1),
  })
  .refine((v) => v.scope !== "SELECTED" || v.documentIds.length > 0, {
    message: "Select at least one document",
  });
export async function decideAccess(user: Document, input: unknown) {
  if (user.role !== "PATIENT")
    throw new AppError(403, "Patient account required");
  const body = approvalSchema.parse(input),
    d = await db(),
    session = connection().startSession();
  const patientId = String(user._id);
  if (body.scope === "SELECTED") {
    const count = await d
      .collection("medical_documents")
      .countDocuments({ _id: { $in: body.documentIds.map(oid) }, patientId });
    if (count !== new Set(body.documentIds).size)
      throw new AppError(400, "Invalid document selection");
  }
  try {
    await session.withTransaction(async () => {
      let request = await d
        .collection("doctor_access_requests")
        .findOneAndUpdate(
          { _id: oid(body.requestId), patientId, status: "PENDING" },
          {
            $set: {
              status: body.decision === "APPROVE" ? "APPROVED" : "REJECTED",
              decidedAt: new Date(),
            },
          },
          { session },
        );
      let collection = "doctor_access_grants";
      if (!request) {
        request = await d.collection("pharmacy_access_requests").findOneAndUpdate(
          { _id: oid(body.requestId), patientId, status: "PENDING" },
          {
            $set: {
              status: body.decision === "APPROVE" ? "APPROVED" : "REJECTED",
              decidedAt: new Date(),
            },
          },
          { session },
        );
        collection = "pharmacy_access_grants";
      }
      if (!request) throw new AppError(404, "Pending request not found");
      const pharmacyRequest = collection === "pharmacy_access_grants";
      const allowed = pharmacyRequest
        ? [
            "READ_RECORDS",
            "QUERY_MEDICAL_HISTORY",
            "UPLOAD_PHARMACY_DOCUMENT",
            "CREATE_PHARMACY_ENCOUNTER",
            "RECORD_MEDICINE_DISPENSING",
          ]
        : [
            "READ_RECORDS",
            "QUERY_MEDICAL_HISTORY",
            "ADD_CLINICAL_DOCUMENT",
            "CREATE_OUTPATIENT_ENCOUNTER",
          ];
      if (body.capabilities.some((capability) => !allowed.includes(capability)))
        throw new AppError(400, "Permission is not available for this provider role");
      if (body.decision === "APPROVE") {
        const grant = {
          patientId,
          ...(pharmacyRequest
            ? {
                providerRole: "PHARMACY",
                pharmacyUserId: request.pharmacyUserId,
                pharmacyId: request.pharmacyId,
                pharmacyName: request.pharmacyName,
                pharmacyStaffName: request.pharmacyStaffName,
              }
            : {
                providerRole: "DOCTOR",
                doctorId: request.doctorId,
                doctorName: request.doctorName,
              }),
          requestId: body.requestId,
          scope: body.scope,
          documentIds: body.documentIds,
          capabilities: body.capabilities,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + body.minutes * 60000),
          revokedAt: null,
        };
        await d.collection(collection).insertOne(grant, { session });
        await d
          .collection("consent_records")
          .insertOne(
            {
              ...grant,
              type: pharmacyRequest ? "PHARMACY_ACCESS" : "DOCTOR_ACCESS",
              version: "2026-11-14",
            },
            { session },
          );
      }
    });
  } finally {
    await session.endSession();
  }
  await audit(
    patientId,
    body.decision === "APPROVE" ? "ACCESS_APPROVED" : "ACCESS_REJECTED",
    body.requestId,
  );
}
