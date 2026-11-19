import { db, connection } from "../lib/db";

const d = await db();
const chunks = await d.collection("document_chunks").find({}).toArray();
const missing = chunks.filter((c) => !c.filename);
console.log("total chunks:", chunks.length, "missing filename:", missing.length);
for (const c of missing.slice(0, 5))
  console.log("  missing:", JSON.stringify({ id: String(c._id), documentId: c.documentId, patientId: c.patientId, page: c.page, keys: Object.keys(c) }));
console.log("--- patient 6af7fd234bce1b9ab1c6bd12 chunks ---");
const mine = chunks.filter((c) => c.patientId === "6af7fd234bce1b9ab1c6bd12");
for (const c of mine)
  console.log(JSON.stringify({ documentId: c.documentId, page: c.page, filename: c.filename, category: c.category, verification: c.verification, reportDate: c.reportDate, text: String(c.text).slice(0, 80) }));
console.log("--- observations for that patient ---");
const obs = await d.collection("medical_observations").find({ patientId: "6af7fd234bce1b9ab1c6bd12" }).toArray();
for (const o of obs) console.log(JSON.stringify({ test: o.test, result: o.result, unit: o.unit, documentId: o.documentId, page: o.page, category: o.category }));
console.log("--- observations total / by category ---");
console.log(JSON.stringify(await d.collection("medical_observations").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray()));
console.log("--- docs with non-medical-ish categories ---");
console.log(JSON.stringify(await d.collection("medical_documents").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray()));
console.log("--- ai_usage_metrics ---");
console.log(JSON.stringify(await d.collection("ai_usage_metrics").find({}).sort({ createdAt: -1 }).limit(5).toArray()));
await connection().close();
process.exit(0);
