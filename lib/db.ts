import dns from "node:dns";
import { MongoClient, GridFSBucket } from "mongodb";

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public hint: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

let client: MongoClient | undefined;
let dnsApplied = false;

function configuredServers() {
  return (process.env.MONGODB_DNS_SERVERS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function configureDns(servers?: string[]) {
  const list = servers ?? configuredServers();
  if (!list.length) return;
  dns.setServers(list);
  dnsApplied = true;
}

function isResolverFailure(error: unknown) {
  const code = (error as { code?: string })?.code || "";
  const message = (error as Error)?.message || "";
  if (
    !["ECONNREFUSED", "ENOTFOUND", "ESERVFAIL", "ENODATA", "ETIMEOUT"].includes(
      code,
    )
  )
    return false;
  return (
    message.includes("querySrv") ||
    message.includes("queryTxt") ||
    message.includes("getaddrinfo")
  );
}

export function connection() {
  if (!process.env.MONGODB_URI)
    throw new ConfigurationError(
      "Database is not configured",
      "Set MONGODB_URI in .env.local and restart the server.",
    );
  return (client ??= new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    retryWrites: true,
  }));
}

export async function connect() {
  const current = connection();
  try {
    await current.connect();
    return current;
  } catch (error) {
    if (!isResolverFailure(error)) throw error;
    await current.close().catch(() => {});
    client = undefined;
    if (dnsApplied)
      throw new ConfigurationError(
        "MongoDB host could not be resolved",
        "Set MONGODB_DNS_SERVERS to a reachable DNS resolver in .env.local and restart the server.",
        { cause: error },
      );
    configureDns(["1.1.1.1", "8.8.8.8"]);
    const retry = connection();
    try {
      await retry.connect();
      return retry;
    } catch (retryError) {
      await retry.close().catch(() => {});
      client = undefined;
      throw new ConfigurationError(
        "MongoDB host could not be resolved",
        "The local DNS resolver cannot answer SRV queries for this Atlas cluster. Set MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8 in .env.local, or point MONGODB_URI at a local MongoDB replica set.",
        { cause: retryError },
      );
    }
  }
}

export async function db() {
  await connect();
  return connection().db(process.env.MONGODB_DB_NAME || "shebamed");
}

export async function bucket() {
  return new GridFSBucket(await db(), { bucketName: "medical_files" });
}

const collections = [
  "users",
  "patient_profiles",
  "doctor_profiles",
  "pharmacy_profiles",
  "organizations",
  "medical_documents",
  "medical_observations",
  "medical_encounters",
  "document_chunks",
  "doctor_access_requests",
  "doctor_access_grants",
  "pharmacy_access_requests",
  "pharmacy_access_grants",
  "consent_records",
  "sharing_codes",
  "recovery_codes",
  "ai_conversations",
  "ai_messages",
  "processing_jobs",
  "audit_events",
  "system_settings",
  "sessions",
  "rate_limits",
  "storage_usage",
  "worker_heartbeats",
  "ai_usage_metrics",
];

export async function setup() {
  const d = await db();
  await d.command({ ping: 1 });
  for (const name of collections)
    if (!(await d.listCollections({ name }).hasNext()))
      await d.createCollection(name);
  for (const [name, key] of [
    ["users", "phoneE164"],
    ["users", "shebamedId"],
    ["sessions", "tokenHash"],
    ["sharing_codes", "codeHash"],
    ["recovery_codes", "codeHash"],
    ["storage_usage", "key"],
    ["processing_jobs", "documentId"],
  ])
    await d.collection(name).createIndex({ [key]: 1 }, { unique: true });
  await d
    .collection("pharmacy_profiles")
    .createIndex({ registrationNumber: 1 }, { unique: true });
  for (const name of ["sessions", "sharing_codes", "rate_limits", "ai_messages"])
    await d
      .collection(name)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await d
    .collection("medical_documents")
    .createIndex({ patientId: 1, reportDate: -1, createdAt: -1 });
  await d
    .collection("medical_documents")
    .createIndex({ patientId: 1, status: 1, contentHash: 1 });
  await d.collection("document_chunks").createIndex({ text: "text" });
  await d
    .collection("document_chunks")
    .createIndex({ patientId: 1, documentId: 1 });
  await d
    .collection("document_chunks")
    .createIndex({ patientId: 1, reportDate: -1 });
  await d
    .collection("document_chunks")
    .createIndex({ chunkId: 1 }, { unique: true, sparse: true });
  await d
    .collection("medical_observations")
    .createIndex({ patientId: 1, documentId: 1 });
  await d
    .collection("medical_observations")
    .createIndex({ patientId: 1, test: 1, reportDate: -1 });
  await d
    .collection("medical_observations")
    .createIndex({ documentId: 1, page: 1 });
  await d
    .collection("doctor_access_grants")
    .createIndex({ patientId: 1, doctorId: 1, expiresAt: 1 });
  await d
    .collection("doctor_access_requests")
    .createIndex({ patientId: 1, status: 1, createdAt: -1 });
  await d
    .collection("pharmacy_access_grants")
    .createIndex({ patientId: 1, pharmacyId: 1, expiresAt: 1 });
  await d
    .collection("pharmacy_access_requests")
    .createIndex({ patientId: 1, status: 1, createdAt: -1 });
  await d
    .collection("processing_jobs")
    .createIndex({ status: 1, leaseUntil: 1 });
  await d.collection("consent_records").createIndex({ patientId: 1 });
  await d.collection("audit_events").createIndex({ createdAt: -1 });
  await d
    .collection("ai_messages")
    .createIndex({ cacheKey: 1 }, { unique: true, sparse: true });
  await d
    .collection("ai_usage_metrics")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await d
    .collection("worker_heartbeats")
    .createIndex({ lastSeenAt: -1 });
}

let schemaPromise: Promise<void> | undefined;
export function ensureSchema() {
  return (schemaPromise ??= setup().catch((error) => {
    schemaPromise = undefined;
    throw error;
  }));
}
