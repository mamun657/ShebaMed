import { db, connection } from "../lib/db";
import { retrieveEvidence } from "../lib/rag";
import { ObjectId } from "mongodb";

const patientId = process.argv[2];
const question = process.argv[3] ?? "What was my previous CBC result?";
const user = await (
  await db()
).collection("users").findOne({ _id: new ObjectId(patientId) });
if (!user) {
  console.log("patient not found");
  process.exit(1);
}
const evidence = await retrieveEvidence(user as never, patientId, question);
console.log("QUESTION:", question);
console.log("OBSERVATIONS:", evidence.observations.length);
for (const observation of evidence.observations)
  console.log(
    "  -",
    observation.test,
    "=",
    observation.result,
    observation.unit,
    "page",
    observation.page,
    "doc",
    observation.documentId,
    "verification",
    observation.verification,
  );
console.log("PASSAGES:", evidence.passages.length);
for (const passage of evidence.passages)
  console.log(
    "  - doc",
    passage.documentId,
    "page",
    passage.page,
    "text:",
    JSON.stringify(passage.text.slice(0, 160)),
  );
console.log("DOCUMENTS:", evidence.documents.length);
for (const doc of evidence.documents)
  console.log(
    "  -",
    String(doc._id),
    doc.filename,
    doc.category,
    doc.reportDate,
    doc.verification,
  );
await connection().close();
process.exit(0);
