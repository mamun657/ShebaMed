import { createHmac, randomBytes } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";
import { ObjectId, Document } from "mongodb";
import { db } from "./db";
import { normalizeCategory } from "./medical";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128);
export function normalizePhone(value: string) {
  const phone = parsePhoneNumberFromString(value, "BD");
  if (
    !phone?.isValid() ||
    phone.country !== "BD" ||
    !/^\+8801[3-9]\d{8}$/.test(phone.number)
  )
    throw new AppError(400, "Enter a valid Bangladeshi mobile number");
  return phone.number;
}
export function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32)
    throw new AppError(
      503,
      "Configure AUTH_SECRET with at least 32 random characters",
    );
  return value;
}
export function digest(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function randomToken() {
  return randomBytes(32).toString("base64url");
}
export function userId(role: string) {
  const prefix = role === "PHARMACY" ? "PH" : role[0];
  return `SM-${prefix}-${randomBytes(10).toString("hex").toUpperCase()}`;
}
export function oid(value: string) {
  if (!/^[a-f0-9]{24}$/i.test(value))
    throw new AppError(400, "Invalid identifier");
  return new ObjectId(value);
}
export async function rateLimit(key: string, limit: number, minutes = 15) {
  const d = await db(),
    window = Math.floor(Date.now() / (minutes * 60000));
  const row = await d
    .collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits")
    .findOneAndUpdate(
      { _id: digest(`${key}:${window}`) },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 1) * minutes * 60000) },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (row!.count > limit)
    throw new AppError(429, "Too many attempts. Please try again later.");
}
export function checkOrigin(request: Request) {
  if (["GET", "HEAD"].includes(request.method)) return;
  const expected = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ).origin;
  if (request.headers.get("origin") !== expected)
    throw new AppError(403, "Request origin is not allowed");
}
export async function audit(actorId: string, action: string, targetId: string) {
  await (
    await db()
  )
    .collection("audit_events")
    .insertOne({ actorId, action, targetId, createdAt: new Date() });
}
export type Capability =
  | "READ_RECORDS"
  | "QUERY_MEDICAL_HISTORY"
  | "ADD_CLINICAL_DOCUMENT"
  | "CREATE_OUTPATIENT_ENCOUNTER"
  | "UPLOAD_PHARMACY_DOCUMENT"
  | "CREATE_PHARMACY_ENCOUNTER"
  | "RECORD_MEDICINE_DISPENSING";
export const capabilities: Capability[] = [
  "READ_RECORDS",
  "QUERY_MEDICAL_HISTORY",
  "ADD_CLINICAL_DOCUMENT",
  "CREATE_OUTPATIENT_ENCOUNTER",
  "UPLOAD_PHARMACY_DOCUMENT",
  "CREATE_PHARMACY_ENCOUNTER",
  "RECORD_MEDICINE_DISPENSING",
];
const roleCapabilities: Record<string, Capability[]> = {
  DOCTOR: [
    "READ_RECORDS",
    "QUERY_MEDICAL_HISTORY",
    "ADD_CLINICAL_DOCUMENT",
    "CREATE_OUTPATIENT_ENCOUNTER",
  ],
  PHARMACY: [
    "READ_RECORDS",
    "QUERY_MEDICAL_HISTORY",
    "UPLOAD_PHARMACY_DOCUMENT",
    "CREATE_PHARMACY_ENCOUNTER",
    "RECORD_MEDICINE_DISPENSING",
  ],
};
export function grantMatches(
  grant: Document,
  capability: Capability,
  record?: Document,
  now = new Date(),
) {
  const scopeCoversRecord = (scope: string, category?: string) => {
    if (scope === "ALL") return true;
    if (!category) return false;
    return normalizeCategory(scope) === normalizeCategory(category);
  };
  return (
    !grant.revokedAt &&
    new Date(grant.expiresAt) > now &&
    grant.capabilities.includes(capability) &&
    (!record ||
      (grant.scope === "SELECTED" &&
        grant.documentIds.includes(String(record._id))) ||
      scopeCoversRecord(grant.scope, record.category))
  );
}
export async function grantsFor(user: Document, patientId: string) {
  if (
    !["DOCTOR", "PHARMACY"].includes(user.role) ||
    user.professionalStatus !== "APPROVED"
  )
    throw new AppError(403, "An admin-reviewed provider account is required");
  const pharmacy = user.role === "PHARMACY";
  const profile = pharmacy
    ? await (await db())
        .collection("pharmacy_profiles")
        .findOne({ userId: String(user._id) })
    : null;
  if (pharmacy && !profile)
    throw new AppError(403, "Pharmacy profile is unavailable");
  return (await db())
    .collection(pharmacy ? "pharmacy_access_grants" : "doctor_access_grants")
    .find({
      [pharmacy ? "pharmacyUserId" : "doctorId"]: String(user._id),
      ...(pharmacy ? { pharmacyId: String(profile!._id) } : {}),
      patientId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
    .toArray();
}
export async function authorize(
  user: Document,
  patientId: string,
  capability: Capability,
  record?: Document,
) {
  if (user.role === "PATIENT" && String(user._id) === patientId) return;
  if (!roleCapabilities[user.role]?.includes(capability))
    throw new AppError(403, "This action is not available to your role");
  const grants = await grantsFor(user, patientId);
  if (!grants.some((g) => grantMatches(g, capability, record)))
    throw new AppError(
      403,
      "Access is missing, expired, revoked, or outside the approved scope",
    );
}
export async function allowedRecords(
  user: Document,
  patientId: string,
  capability: Capability = "READ_RECORDS",
) {
  const d = await db();
  if (user.role === "PATIENT" && String(user._id) === patientId)
    return d
      .collection("medical_documents")
      .find({ patientId })
      .sort({ reportDate: -1, createdAt: -1 })
      .toArray();
  const grants = await grantsFor(user, patientId);
  if (!grants.some((g) => grantMatches(g, capability)))
    throw new AppError(403, "No active permission");
  const docs = await d
    .collection("medical_documents")
    .find({ patientId })
    .sort({ reportDate: -1 })
    .toArray();
  return docs.filter((doc) =>
    grants.some((g) => grantMatches(g, capability, doc)),
  );
}
