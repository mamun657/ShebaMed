import argon2 from "argon2";
import { cookies } from "next/headers";
import { Document } from "mongodb";
import { db, connection, ensureSchema } from "./db";
import {
  AppError,
  digest,
  normalizePhone,
  passwordSchema,
  randomToken,
  userId,
  audit,
} from "./security";
import { z } from "zod";
export const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string(),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["PATIENT", "DOCTOR", "PHARMACY"]),
    consent: z.literal(true),
    registrationNumber: z.string().max(100).optional(),
    specialization: z.string().max(100).optional(),
    workplace: z.string().max(200).optional(),
    credentialDetails: z.string().max(2000).optional(),
    pharmacyName: z.string().trim().min(2).max(150).optional(),
    address: z.string().trim().min(2).max(300).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().max(40).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
  })
  .refine(
    (v) =>
      v.role !== "DOCTOR" ||
      !!(
        v.registrationNumber &&
        v.specialization &&
        v.workplace &&
        v.credentialDetails
      ),
    { message: "Complete all professional details" },
  )
  .refine(
    (v) =>
      v.role !== "PHARMACY" ||
      !!(
        v.pharmacyName &&
        v.registrationNumber &&
        v.address &&
        v.credentialDetails
      ),
    { message: "Complete all pharmacy registration details" },
  );
export async function register(input: unknown) {
  await ensureSchema();
  const data = registrationSchema.parse(input),
    d = await db();
  const codes = Array.from({ length: 6 }, () => randomToken());
  const user = {
    name: data.name,
    phoneE164: normalizePhone(data.phone),
    passwordHash: await argon2.hash(data.password, { type: argon2.argon2id }),
    role: data.role,
    shebamedId: userId(data.role),
    status: "ACTIVE",
    phoneOwnership: "UNVERIFIED",
    professionalStatus: data.role === "PATIENT" ? null : "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const session = connection().startSession();
  let id = "";
  try {
    await session.withTransaction(async () => {
      const result = await d.collection("users").insertOne(user, { session });
      id = String(result.insertedId);
      await d.collection("recovery_codes").insertMany(
        codes.map((code) => ({
          userId: id,
          codeHash: digest(code),
          usedAt: null,
        })),
        { session },
      );
      await d
        .collection(
          data.role === "DOCTOR"
            ? "doctor_profiles"
            : data.role === "PHARMACY"
              ? "pharmacy_profiles"
              : "patient_profiles",
        )
        .insertOne(
          {
            userId: id,
            ...(data.role === "DOCTOR"
              ? {
                  registrationNumber: data.registrationNumber,
                  specialization: data.specialization,
                  workplace: data.workplace,
                  credentialDetails: data.credentialDetails,
                }
              : data.role === "PHARMACY"
                ? {
                    pharmacyName: data.pharmacyName,
                    registrationNumber: data.registrationNumber,
                    address: data.address,
                    workplace: data.address,
                    credentialDetails: data.credentialDetails,
                    createdAt: new Date(),
                  }
                : {
                  dateOfBirth: data.dateOfBirth || null,
                  gender: data.gender || null,
                }),
          },
          { session },
        );
      await d
        .collection("consent_records")
        .insertOne(
          {
            patientId: id,
            type: "ACCOUNT_PRIVACY",
            version: "2026-11-14",
            createdAt: new Date(),
          },
          { session },
        );
    });
  } catch (e) {
    if ((e as { code?: number }).code === 11000)
      throw new AppError(
        409,
        "Unable to register these account details. Try signing in or recovery.",
      );
    throw e;
  } finally {
    await session.endSession();
  }
  await audit(id, "ACCOUNT_CREATED", id);
  return { id, recoveryCodes: codes };
}
export async function createSession(userId: string) {
  const token = randomToken();
  await (
    await db()
  )
    .collection("sessions")
    .insertOne({
      userId,
      tokenHash: digest(token),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 8 * 3600000),
    });
  (await cookies()).set("shebamed_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function currentUser() {
  const token = (await cookies()).get("shebamed_session")?.value;
  if (!token) throw new AppError(401, "Please sign in");
  const d = await db();
  const session = await d
    .collection("sessions")
    .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) throw new AppError(401, "Your session has expired");
  const { ObjectId } = await import("mongodb");
  const user = await d
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId), status: "ACTIVE" });
  if (!user) throw new AppError(401, "Account is unavailable");
  return user;
}
export function publicUser(user: Document) {
  return {
    _id: String(user._id),
    name: user.name,
    phoneE164: user.phoneE164,
    shebamedId: user.shebamedId,
    role: user.role,
    status: user.status,
    professionalStatus: user.professionalStatus,
    phoneOwnership: user.phoneOwnership,
    createdAt: user.createdAt,
  };
}
export async function recover(phone: string, code: string, password: string) {
  passwordSchema.parse(password);
  const d = await db(),
    user = await d
      .collection("users")
      .findOne({ phoneE164: normalizePhone(phone), status: "ACTIVE" });
  if (!user) throw new AppError(400, "Invalid recovery details");
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const session = connection().startSession();
  try {
    await session.withTransaction(async () => {
      const used = await d
        .collection("recovery_codes")
        .findOneAndUpdate(
          { userId: String(user._id), codeHash: digest(code), usedAt: null },
          { $set: { usedAt: new Date() } },
          { session },
        );
      if (!used) throw new AppError(400, "Invalid recovery details");
      await d
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { passwordHash: hash, updatedAt: new Date() } },
          { session },
        );
      await d
        .collection("sessions")
        .deleteMany({ userId: String(user._id) }, { session });
    });
  } finally {
    await session.endSession();
  }
  await audit(String(user._id), "PASSWORD_RECOVERED", String(user._id));
}
