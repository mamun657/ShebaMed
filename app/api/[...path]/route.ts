import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import argon2 from "argon2";
import { z } from "zod";
import { Document } from "mongodb";
import { db, bucket, connection } from "@/lib/db";
import {
  register,
  createSession,
  currentUser,
  publicUser,
  recover,
} from "@/lib/auth";
import {
  AppError,
  checkOrigin,
  normalizePhone,
  rateLimit,
  digest,
  oid,
  authorize,
  allowedRecords,
  audit,
  passwordSchema,
} from "@/lib/security";
import {
  storeDocument,
  extractionSchema,
  retryDocument,
  workerStatus,
  reconcileOrphanDocuments,
} from "@/lib/processing";
import {
  medicineChunkText,
  reconcileReviewedMedicines,
} from "@/lib/prescription";
import { queryHistory } from "@/lib/rag";
import {
  createSharingCode,
  requestAccess,
  requestPharmacyAccess,
  decideAccess,
} from "@/lib/access";
import { normalizeCategory } from "@/lib/medical";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const route = (await params).path.join("/");
  const method = req.method;
  try {
    checkOrigin(req);
    const d = await db();
    const read = () => {
      if (Number(req.headers.get("content-length") || 0) > 1000000)
        throw new AppError(413, "Request body too large");
      return req.json();
    };
    if (
      method === "POST" &&
      ["auth/register", "auth/login", "auth/recover"].includes(route)
    ) {
      await rateLimit("auth-global", 80);
      const body = await read();
      if (typeof body.phone !== "string")
        throw new AppError(400, "Mobile number required");
      await rateLimit(`auth:${normalizePhone(body.phone)}`, 8);
      if (route === "auth/register") {
        const result = await register(body);
        await createSession(result.id);
        return json(result, 201);
      }
      if (route === "auth/recover") {
        await recover(
          body.phone,
          z.string().min(20).max(100).parse(body.code),
          body.password,
        );
        return json({ ok: true });
      }
      const user = await d
        .collection("users")
        .findOne({ phoneE164: normalizePhone(body.phone), status: "ACTIVE" });
      const password = z.string().max(128).parse(body.password);
      if (!user || !(await argon2.verify(user.passwordHash, password)))
        throw new AppError(401, "Invalid mobile number or password");
      await createSession(String(user._id));
      return json({ user: publicUser(user) });
    }
    const user = await currentUser(),
      uid = String(user._id);
    await rateLimit(`api:${uid}`, 200, 1);
    if (route === "auth/me")
      return json({
        user: publicUser(user),
        profile: await d
          .collection(
            user.role === "DOCTOR"
              ? "doctor_profiles"
              : user.role === "PHARMACY"
                ? "pharmacy_profiles"
                : "patient_profiles",
          )
          .findOne({ userId: uid }),
      });
    if (route === "auth/logout" && method === "POST") {
      const token = (await cookies()).get("shebamed_session")?.value;
      if (token)
        await d.collection("sessions").deleteOne({ tokenHash: digest(token) });
      (await cookies()).delete("shebamed_session");
      return json({ ok: true });
    }
    if (route === "auth/password" && method === "POST") {
      const body = await read();
      passwordSchema.parse(body.password);
      if (
        !(await argon2.verify(
          user.passwordHash,
          z.string().max(128).parse(body.currentPassword),
        ))
      )
        throw new AppError(400, "Current password is incorrect");
      await d
        .collection("users")
        .updateOne(
          { _id: user._id },
          {
            $set: {
              passwordHash: await argon2.hash(body.password, {
                type: argon2.argon2id,
              }),
            },
          },
        );
      await d.collection("sessions").deleteMany({ userId: uid });
      (await cookies()).delete("shebamed_session");
      await audit(uid, "PASSWORD_CHANGED", uid);
      return json({ ok: true });
    }
    if (route === "profile" && method === "PATCH") {
      const body = z
        .object({
          name: z.string().min(2).max(100),
          dateOfBirth: z.string().max(10).optional(),
          gender: z.string().max(40).optional(),
          pharmacyName: z.string().trim().min(2).max(150).optional(),
          registrationNumber: z.string().trim().min(1).max(100).optional(),
          address: z.string().trim().min(2).max(300).optional(),
          credentialDetails: z.string().trim().min(2).max(2000).optional(),
        })
        .parse(await read());
      if (user.role === "PHARMACY") {
        const { pharmacyName, registrationNumber, address, credentialDetails } =
          body;
        if (
          !pharmacyName ||
          !registrationNumber ||
          !address ||
          !credentialDetails
        )
          throw new AppError(400, "Complete all pharmacy registration details");
        const session = connection().startSession();
        try {
          await session.withTransaction(async () => {
            const profileResult = await d
              .collection("pharmacy_profiles")
              .updateOne(
                { userId: uid },
                {
                  $set: {
                    pharmacyName,
                    registrationNumber,
                    address,
                    workplace: address,
                    credentialDetails,
                    updatedAt: new Date(),
                  },
                },
                { session },
              );
            if (!profileResult.matchedCount)
              throw new AppError(404, "Pharmacy profile not found");
            await d.collection("users").updateOne(
              { _id: user._id },
              {
                $set: {
                  name: body.name,
                  professionalStatus: "PENDING",
                  updatedAt: new Date(),
                },
              },
              { session },
            );
            await d.collection("pharmacy_access_grants").updateMany(
              { pharmacyUserId: uid, revokedAt: null },
              {
                $set: {
                  revokedAt: new Date(),
                  revocationReason: "PHARMACY_PROFILE_CHANGED",
                },
              },
              { session },
            );
          });
        } finally {
          await session.endSession();
        }
        await audit(uid, "PHARMACY_PROFILE_UPDATED", uid);
      } else {
        await d
          .collection("users")
          .updateOne(
            { _id: user._id },
            { $set: { name: body.name, updatedAt: new Date() } },
          );
      }
      if (user.role === "PATIENT")
        await d
          .collection("patient_profiles")
          .updateOne(
            { userId: uid },
            { $set: { dateOfBirth: body.dateOfBirth, gender: body.gender } },
            { upsert: true },
          );
      return json({ ok: true });
    }
    if (route.startsWith("admin/")) {
      if (user.role !== "ADMIN")
        throw new AppError(403, "Administrator required");
      const sub = route.slice(6);
      if (sub === "overview")
        return json({
          users: await d.collection("users").countDocuments(),
          patients: await d
            .collection("users")
            .countDocuments({ role: "PATIENT" }),
          doctors: await d
            .collection("users")
            .countDocuments({ role: "DOCTOR" }),
          pharmacies: await d
            .collection("users")
            .countDocuments({ role: "PHARMACY" }),
          pending: await d
            .collection("users")
            .countDocuments({
              role: { $in: ["DOCTOR", "PHARMACY"] },
              professionalStatus: "PENDING",
            }),
          storage: await d
            .collection("storage_usage")
            .findOne({ key: "global" }),
          failedJobs: await d
            .collection("processing_jobs")
            .countDocuments({ status: "FAILED" }),
        });
      if (sub === "users" && method === "GET")
        return json({
          users: (await d.collection("users").find().limit(200).toArray()).map(
            publicUser,
          ),
        });
      if (sub === "doctors" && method === "GET") {
        const doctors = await d
          .collection("users")
          .find({ role: "DOCTOR" })
          .toArray();
        return json({
          doctors: await Promise.all(
            doctors.map(async (u) => ({
              ...publicUser(u),
              profile: await d
                .collection("doctor_profiles")
                .findOne({ userId: String(u._id) }),
            })),
          ),
        });
      }
      if (sub === "pharmacies" && method === "GET") {
        const pharmacies = await d
          .collection("users")
          .find({ role: "PHARMACY" })
          .toArray();
        return json({
          pharmacies: await Promise.all(
            pharmacies.map(async (u) => ({
              ...publicUser(u),
              profile: await d
                .collection("pharmacy_profiles")
                .findOne({ userId: String(u._id) }),
            })),
          ),
        });
      }
      if (sub === "review" && method === "POST") {
        const body = z
          .object({
            id: z.string(),
            decision: z.enum(["APPROVED", "REJECTED"]),
          })
          .parse(await read());
        await d
          .collection("users")
          .updateOne(
            { _id: oid(body.id), role: "DOCTOR" },
            {
              $set: {
                professionalStatus: body.decision,
                reviewedAt: new Date(),
                reviewedBy: uid,
              },
            },
          );
        await audit(uid, "DOCTOR_" + body.decision, body.id);
        return json({ ok: true });
      }
      if (sub === "pharmacy-review" && method === "POST") {
        const body = z
          .object({
            id: z.string(),
            decision: z.enum(["APPROVED", "REJECTED"]),
          })
          .parse(await read());
        const session = connection().startSession();
        try {
          await session.withTransaction(async () => {
            const result = await d.collection("users").updateOne(
              { _id: oid(body.id), role: "PHARMACY" },
              {
                $set: {
                  professionalStatus: body.decision,
                  reviewedAt: new Date(),
                  reviewedBy: uid,
                },
              },
              { session },
            );
            if (!result.matchedCount)
              throw new AppError(404, "Pharmacy not found");
            if (body.decision === "REJECTED")
              await d.collection("pharmacy_access_grants").updateMany(
                { pharmacyUserId: body.id, revokedAt: null },
                {
                  $set: {
                    revokedAt: new Date(),
                    revocationReason: "PHARMACY_VERIFICATION_REJECTED",
                  },
                },
                { session },
              );
          });
        } finally {
          await session.endSession();
        }
        await audit(uid, "PHARMACY_" + body.decision, body.id);
        return json({ ok: true });
      }
      if (sub === "status" && method === "POST") {
        const body = z
          .object({ id: z.string(), status: z.enum(["ACTIVE", "SUSPENDED"]) })
          .parse(await read());
        if (body.id === uid)
          throw new AppError(400, "Cannot suspend your own account");
        await d
          .collection("users")
          .updateOne(
            { _id: oid(body.id), role: { $ne: "ADMIN" } },
            { $set: { status: body.status } },
          );
        await d.collection("sessions").deleteMany({ userId: body.id });
        await audit(uid, "ACCOUNT_" + body.status, body.id);
        return json({ ok: true });
      }
      if (sub === "audit")
        return json({
          events: await d
            .collection("audit_events")
            .find()
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray(),
        });
      if (sub === "system")
        return json({
          database:
            (await d.command({ ping: 1 })).ok === 1
              ? "Connected"
              : "Unavailable",
          storage: await d
            .collection("storage_usage")
            .findOne({ key: "global" }),
          jobs: await d
            .collection("processing_jobs")
            .find({}, { projection: { documentId: 0, patientId: 0 } })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray(),
        });
      if (sub === "organizations") {
        if (method === "POST") {
          const body = z
            .object({
              name: z.string().min(2).max(150),
              address: z.string().max(300),
            })
            .parse(await read());
          await d
            .collection("organizations")
            .insertOne({ ...body, createdAt: new Date() });
        }
        return json({
          organizations: await d.collection("organizations").find().toArray(),
        });
      }
    }
    if (route === "access" && method === "GET") {
      if (!["PATIENT", "DOCTOR", "PHARMACY"].includes(user.role))
        throw new AppError(403, "Provider or patient account required");
      const patient = user.role === "PATIENT";
      const pharmacy = user.role === "PHARMACY";
      const requestsCollection = pharmacy
        ? "pharmacy_access_requests"
        : "doctor_access_requests";
      const grantsCollection = pharmacy
        ? "pharmacy_access_grants"
        : "doctor_access_grants";
      const requests = patient
        ? [
            ...(await d
              .collection("doctor_access_requests")
              .find({ patientId: uid })
              .toArray())
              .map((row) => ({ ...row, providerRole: "DOCTOR" })),
            ...(await d
              .collection("pharmacy_access_requests")
              .find({ patientId: uid })
              .toArray()),
          ]
        : await d
            .collection(requestsCollection)
            .find(
              pharmacy
                ? { pharmacyUserId: uid }
                : { doctorId: uid },
            )
            .toArray();
      const grants = patient
        ? [
            ...(await d
              .collection("doctor_access_grants")
              .find({ patientId: uid })
              .toArray())
              .map((row) => ({ ...row, providerRole: "DOCTOR" })),
            ...(await d
              .collection("pharmacy_access_grants")
              .find({ patientId: uid })
              .toArray()),
          ]
        : await d
            .collection(grantsCollection)
            .find(
              pharmacy
                ? { pharmacyUserId: uid }
                : { doctorId: uid },
            )
            .toArray();
      return json({
        requests: requests.sort(
          (a, b) =>
            new Date((b as Document).createdAt).getTime() -
            new Date((a as Document).createdAt).getTime(),
        ),
        grants: grants.sort(
          (a, b) =>
            new Date((b as Document).createdAt).getTime() -
            new Date((a as Document).createdAt).getTime(),
        ),
      });
    }
    if (route === "access/code" && method === "POST") {
      await rateLimit(`share:${uid}`, 10);
      return json(await createSharingCode(user));
    }
    if (route === "access/request" && method === "POST") {
      await rateLimit(`request:${uid}`, 10);
      const code = z.string().min(10).max(100).parse((await read()).code);
      if (user.role === "DOCTOR") await requestAccess(user, code);
      else if (user.role === "PHARMACY")
        await requestPharmacyAccess(user, code);
      else throw new AppError(403, "Provider account required");
      return json({ ok: true });
    }
    if (route === "access/decision" && method === "POST") {
      await decideAccess(user, await read());
      return json({ ok: true });
    }
    if (route === "access/revoke" && method === "POST") {
      if (user.role !== "PATIENT") throw new AppError(403, "Patient required");
      const id = z.string().parse((await read()).id);
      let result = await d
        .collection("doctor_access_grants")
        .updateOne(
          { _id: oid(id), patientId: uid },
          { $set: { revokedAt: new Date() } },
        );
      if (!result.matchedCount) {
        result = await d.collection("pharmacy_access_grants").updateOne(
          { _id: oid(id), patientId: uid },
          { $set: { revokedAt: new Date() } },
        );
      }
      if (!result.matchedCount) throw new AppError(404, "Grant not found");
      await audit(uid, "ACCESS_REVOKED", id);
      return json({ ok: true });
    }
    const patientId = req.nextUrl.searchParams.get("patientId") || uid;
    if (route === "records" && method === "GET") {
      const records = await allowedRecords(user, patientId);
      await audit(uid, "RECORDS_VIEWED", patientId);
      return json({
        records: records.map((record) => ({
          ...record,
          category: normalizeCategory(record.category),
        })),
        worker: records.some((record) =>
          ["UPLOADED", "QUEUED", "PROCESSING"].includes(record.status),
        )
          ? await workerStatus()
          : null,
      });
    }
    if (route === "records/upload" && method === "POST") {
      await rateLimit(`upload:${uid}`, 15);
      const uploadCapability =
        user.role === "PHARMACY"
          ? "UPLOAD_PHARMACY_DOCUMENT"
          : "ADD_CLINICAL_DOCUMENT";
      await authorize(user, patientId, uploadCapability);
      if (
        Number(req.headers.get("content-length") || 0) >
        Number(process.env.MAX_FILE_MB || 5) * 1024 * 1024 + 65536
      )
        throw new AppError(413, "Upload too large");
      const form = await req.formData(),
        file = form.get("file");
      if (!(file instanceof File)) throw new AppError(400, "Select a file");
      const bytes = Buffer.from(await file.arrayBuffer());
      await authorize(user, patientId, uploadCapability);
      const pharmacyProfile =
        user.role === "PHARMACY"
          ? await d
              .collection("pharmacy_profiles")
              .findOne({ userId: uid })
          : null;
      return json(
        {
          id: await storeDocument(
            bytes,
            file.name,
            patientId,
            uid,
            pharmacyProfile
              ? {
                  source: "PHARMACY_UPLOAD",
                  organizationId: String(pharmacyProfile._id),
                  organizationName: pharmacyProfile.pharmacyName,
                  staffName: user.name,
                }
              : undefined,
          ),
        },
        201,
      );
    }
    if (route === "records/reconcile" && method === "POST") {
      if (user.role === "PHARMACY")
        throw new AppError(403, "This operation is not available to pharmacies");
      await rateLimit(`reconcile:${uid}`, 5);
      await authorize(user, patientId, "READ_RECORDS");
      const requeued = await reconcileOrphanDocuments();
      await audit(uid, "DOCUMENTS_REQUEUED", String(requeued));
      return json({ ok: true, requeued });
    }
    if (route.startsWith("records/")) {
      const [, id, action] = route.split("/"),
        doc = await d.collection("medical_documents").findOne({ _id: oid(id) });
      if (!doc) throw new AppError(404, "Record not found");
      await authorize(user, doc.patientId, "READ_RECORDS", doc);
      if (action === "file" && method === "GET") {
        if (!doc.fileId)
          throw new AppError(
            404,
            "This is a clinical note; no original file exists",
          );
        await audit(uid, "DOCUMENT_DOWNLOADED", id);
        const inline =
          req.nextUrl.searchParams.get("view") === "inline" &&
          doc.mime !== "application/pdf";
        const stream = (await bucket()).openDownloadStream(doc.fileId);
        const { Readable } = await import("node:stream");
        return new Response(Readable.toWeb(stream) as ReadableStream, {
          headers: {
            "Content-Type": doc.mime,
            "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="report-${id}.${doc.mime === "application/pdf" ? "pdf" : doc.mime.split("/")[1]}"`,
            "X-Frame-Options": "SAMEORIGIN",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox; default-src 'none'",
          },
        });
      }
      if (!action && method === "GET")
        return json({
          record: {
            ...doc,
            category: normalizeCategory(doc.category),
            pageTexts: doc.pageTexts ?? [],
          },
        });
      if (user.role !== "PATIENT" || doc.patientId !== uid)
        throw new AppError(
          403,
          "Only the patient can review or retry a report",
        );
      if (action === "review" && method === "POST") {
        if (
          !doc.extracted ||
          !["NEEDS_REVIEW", "COMPLETED"].includes(doc.status)
        )
          throw new AppError(
            409,
            "Wait for extraction before reviewing this report",
          );
        const submitted = extractionSchema.parse(await read());
        if (submitted.observations.some((o) => o.page > (doc.pageCount || 1)))
          throw new AppError(400, "Invalid source page");
        const prescription = reconcileReviewedMedicines(
          submitted.prescription,
          doc.extracted.prescription,
          doc.pageCount || 1,
        );
        const confirmed = { ...submitted, prescription };
        if (!prescription) delete confirmed.prescription;
        await d
          .collection("medical_documents")
          .updateOne(
            { _id: doc._id },
            {
              $set: {
                confirmed,
                title: confirmed.title,
                category: confirmed.category,
                reportDate: confirmed.reportDate,
                status: "COMPLETED",
                verification:
                  doc.verification === "CLINICIAN_VERIFIED"
                    ? "CLINICIAN_VERIFIED"
                    : "PATIENT_CONFIRMED",
                extractionState: "EXTRACTED",
                reviewedAt: new Date(),
              },
            },
          );
        await d
          .collection("medical_observations")
          .deleteMany({ documentId: id });
        const clinical = confirmed.category !== "NON_MEDICAL";
        if (clinical && confirmed.observations.length)
          await d.collection("medical_observations").insertMany(
            confirmed.observations.map((observation) => ({
              ...observation,
              documentId: id,
              patientId: doc.patientId,
              filename: doc.filename,
              reportDate: confirmed.reportDate,
              category: confirmed.category,
              verification: "PATIENT_CONFIRMED",
              processingVersion: doc.processingVersion ?? null,
              contentHash: doc.contentHash ?? null,
              createdAt: new Date(),
            })),
          );
        await d
          .collection("document_chunks")
          .updateMany(
            { documentId: id },
            {
              $set: {
                category: confirmed.category,
                reportDate: confirmed.reportDate,
                verification: "PATIENT_CONFIRMED",
              },
            },
          );
        const medicineText = clinical ? medicineChunkText(prescription) : null;
        if (medicineText)
          await d.collection("document_chunks").updateOne(
            { chunkId: `${id}:medicines` },
            {
              $set: {
                patientId: doc.patientId,
                documentId: id,
                filename: doc.filename,
                page: prescription!.medicines[0].page,
                text: medicineText,
                extractionMethod: "STRUCTURED_MEDICINES",
                ocrConfidence: 100,
                needsReview: false,
                category: confirmed.category,
                reportDate: confirmed.reportDate,
                verification: "PATIENT_CONFIRMED",
                processingVersion: doc.processingVersion ?? null,
                contentHash: doc.contentHash ?? null,
              },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true },
          );
        else
          await d
            .collection("document_chunks")
            .deleteOne({ chunkId: `${id}:medicines` });
        await audit(uid, "EXTRACTION_REVIEWED", id);
        return json({ ok: true });
      }
      if (action === "retry" && method === "POST") {
        await rateLimit(`retry:${uid}`, 10);
        await retryDocument(id, doc.patientId);
        return json({ ok: true });
      }
    }
    if (route === "ai" && method === "POST") {
      await rateLimit(`ai:${uid}`, 12);
      const body = z
        .object({
          question: z.string().min(3).max(1000),
          language: z.enum(["English", "Bangla"]).default("English"),
        })
        .parse(await read());
      await authorize(user, patientId, "QUERY_MEDICAL_HISTORY");
      return json(
        await queryHistory(user, patientId, body.question, body.language),
      );
    }
    if (route === "pharmacy/encounters" && method === "POST") {
      await authorize(user, patientId, "CREATE_PHARMACY_ENCOUNTER");
      const body = z
        .object({
          visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          patientReportedConcern: z.string().trim().min(2).max(2000),
          relevantHistoryReviewed: z.string().max(5000),
          guidanceOrService: z.string().trim().min(2).max(5000),
          doctorReferralRecommended: z.enum(["YES", "NO"]),
          notes: z.string().max(5000),
        })
        .parse(await read());
      const pharmacy = await d
        .collection("pharmacy_profiles")
        .findOne({ userId: uid });
      if (!pharmacy) throw new AppError(403, "Pharmacy profile is unavailable");
      const pharmacyEncounter = {
        ...body,
        pharmacyId: String(pharmacy._id),
        pharmacyName: pharmacy.pharmacyName,
        pharmacyRegistrationNumber: pharmacy.registrationNumber,
        staffId: uid,
        staffName: user.name,
      };
      const text = [
        "Pharmacy assistance encounter. This is not a diagnosis or prescription.",
        `Visit date: ${body.visitDate}`,
        `Patient-reported concern: ${body.patientReportedConcern}`,
        `Relevant history reviewed: ${body.relevantHistoryReviewed || "Not recorded"}`,
        `Guidance or service provided: ${body.guidanceOrService}`,
        `Doctor referral recommended: ${body.doctorReferralRecommended}`,
        `Notes: ${body.notes || "Not recorded"}`,
        `Pharmacy: ${pharmacy.pharmacyName}`,
      ].join("\n");
      const session = connection().startSession();
      let documentId = "";
      try {
        await session.withTransaction(async () => {
          const result = await d.collection("medical_documents").insertOne(
            {
              patientId,
              authorId: uid,
              authorName: user.name,
              documentSource: "PHARMACY_ENCOUNTER",
              organizationId: String(pharmacy._id),
              organizationName: pharmacy.pharmacyName,
              uploadedByStaffId: uid,
              uploadedByStaffName: user.name,
              title: "Pharmacy assistance encounter",
              filename: "Pharmacy encounter",
              category: "PHARMACY_ENCOUNTER",
              reportDate: body.visitDate,
              status: "COMPLETED",
              verification: "UNREVIEWED",
              pharmacyEncounter,
              createdAt: new Date(),
            },
            { session },
          );
          documentId = String(result.insertedId);
          await d.collection("medical_encounters").insertOne(
            {
              ...pharmacyEncounter,
              patientId,
              documentId,
              encounterType: "PHARMACY_ASSISTANCE",
              createdAt: new Date(),
            },
            { session },
          );
          await d.collection("document_chunks").insertOne(
            {
              patientId,
              documentId,
              page: 1,
              text,
              category: "PHARMACY_ENCOUNTER",
              reportDate: body.visitDate,
              verification: "UNREVIEWED",
              createdAt: new Date(),
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
      await audit(uid, "PHARMACY_ENCOUNTER_CREATED", documentId);
      return json({ ok: true, id: documentId }, 201);
    }
    if (route === "pharmacy/dispensing" && method === "POST") {
      await authorize(user, patientId, "RECORD_MEDICINE_DISPENSING");
      const body = z
        .object({
          medicineName: z.string().trim().min(1).max(160),
          activeIngredient: z.string().trim().max(160).optional(),
          activeIngredientVerified: z.boolean().default(false),
          strength: z.string().trim().max(100),
          quantitySupplied: z.string().trim().min(1).max(100),
          dispensingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          prescriptionReference: z.string().trim().max(200).optional(),
        })
        .refine(
          (value) =>
            !value.activeIngredientVerified || !!value.activeIngredient,
          { message: "Enter the verified active ingredient" },
        )
        .parse(await read());
      const pharmacy = await d
        .collection("pharmacy_profiles")
        .findOne({ userId: uid });
      if (!pharmacy) throw new AppError(403, "Pharmacy profile is unavailable");
      const dispensing = {
        medicineName: body.medicineName,
        activeIngredient: body.activeIngredientVerified
          ? body.activeIngredient
          : null,
        activeIngredientVerified: body.activeIngredientVerified,
        strength: body.strength || null,
        quantitySupplied: body.quantitySupplied,
        dispensingDate: body.dispensingDate,
        prescriptionReference: body.prescriptionReference || null,
        pharmacyId: String(pharmacy._id),
        pharmacyName: pharmacy.pharmacyName,
        pharmacyRegistrationNumber: pharmacy.registrationNumber,
        staffId: uid,
        staffName: user.name,
      };
      const text = [
        "Medicine dispensed by a pharmacy. Dispensing does not establish that the patient consumed the medicine.",
        `Medicine: ${dispensing.medicineName}`,
        ...(dispensing.activeIngredient
          ? [`Verified active ingredient: ${dispensing.activeIngredient}`]
          : []),
        `Strength: ${dispensing.strength || "Not recorded"}`,
        `Quantity supplied: ${dispensing.quantitySupplied}`,
        `Dispensing date: ${dispensing.dispensingDate}`,
        `Prescription reference: ${dispensing.prescriptionReference || "Not recorded"}`,
        `Pharmacy: ${pharmacy.pharmacyName}`,
      ].join("\n");
      const session = connection().startSession();
      let documentId = "";
      try {
        await session.withTransaction(async () => {
          const result = await d.collection("medical_documents").insertOne(
            {
              patientId,
              authorId: uid,
              authorName: user.name,
              documentSource: "PHARMACY_DISPENSING",
              organizationId: String(pharmacy._id),
              organizationName: pharmacy.pharmacyName,
              uploadedByStaffId: uid,
              uploadedByStaffName: user.name,
              title: `Medicine dispensed: ${body.medicineName}`,
              filename: "Medicine dispensing record",
              category: "MEDICINE_DISPENSING",
              reportDate: body.dispensingDate,
              status: "COMPLETED",
              verification: "UNREVIEWED",
              pharmacyDispensing: dispensing,
              createdAt: new Date(),
            },
            { session },
          );
          documentId = String(result.insertedId);
          await d.collection("document_chunks").insertOne(
            {
              patientId,
              documentId,
              page: 1,
              text,
              category: "MEDICINE_DISPENSING",
              reportDate: body.dispensingDate,
              verification: "UNREVIEWED",
              createdAt: new Date(),
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
      await audit(uid, "MEDICINE_DISPENSED", documentId);
      return json({ ok: true, id: documentId }, 201);
    }
    if (route === "encounters" && method === "POST") {
      await authorize(user, patientId, "CREATE_OUTPATIENT_ENCOUNTER");
      if (user.role !== "DOCTOR")
        throw new AppError(403, "Doctor account required");
      const body = z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          organization: z.string().max(200),
          chiefComplaint: z.string().min(2).max(2000),
          notes: z.string().min(2).max(10000),
          history: z.string().max(5000),
          diagnosis: z.string().max(2000),
          testOrders: z.string().max(2000),
          followUp: z.string().max(2000),
        })
        .parse(await read());
      const text = Object.entries(body)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      const session = connection().startSession();
      try {
        await session.withTransaction(async () => {
          const result = await d
            .collection("medical_documents")
            .insertOne(
              {
                patientId,
                authorId: uid,
                authorName: user.name,
                title: body.chiefComplaint,
                filename: "Clinical encounter",
                category: "CLINICAL_NOTE",
                reportDate: body.date,
                status: "COMPLETED",
                verification: "CLINICIAN_AUTHORED",
                encounter: body,
                createdAt: new Date(),
              },
              { session },
            );
          await d
            .collection("medical_encounters")
            .insertOne(
              {
                ...body,
                patientId,
                doctorId: uid,
                documentId: String(result.insertedId),
                createdAt: new Date(),
              },
              { session },
            );
          await d
            .collection("document_chunks")
            .insertOne(
              {
                patientId,
                documentId: String(result.insertedId),
                page: 1,
                text,
              },
              { session },
            );
        });
      } finally {
        await session.endSession();
      }
      await audit(uid, "ENCOUNTER_CREATED", patientId);
      return json({ ok: true }, 201);
    }
    throw new AppError(404, "Endpoint not found");
  } catch (error) {
    if (error instanceof AppError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json({ error: error.issues[0]?.message || "Invalid input" }, 400);
    console.error("[api] unhandled error", route, method, error);
    return json(
      {
        error:
          "Service unavailable. The server hit an unexpected error while handling this request.",
      },
      503,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH };
