import { db, connection } from "../lib/db";

const d = await db();
const documents = await d
  .collection("medical_documents")
  .find(
    {},
    {
      projection: {
        filename: 1,
        status: 1,
        category: 1,
        reportDate: 1,
        verification: 1,
        patientId: 1,
        createdAt: 1,
        pageCount: 1,
        error: 1,
        extracted: 1,
      },
    },
  )
  .toArray();
console.log("DOCUMENTS", documents.length);
for (const doc of documents) console.log(JSON.stringify(doc));
const jobs = await d.collection("processing_jobs").find({}).toArray();
console.log("JOBS", jobs.length);
for (const job of jobs) console.log(JSON.stringify(job));
const chunks = await d
  .collection("document_chunks")
  .find({}, { projection: { documentId: 1, page: 1, text: 1 } })
  .toArray();
console.log("CHUNKS", chunks.length);
for (const chunk of chunks)
  console.log(JSON.stringify({ ...chunk, text: chunk.text?.slice(0, 120) }));
const observations = await d.collection("medical_observations").find({}).toArray();
console.log("OBSERVATIONS", observations.length);
for (const observation of observations) console.log(JSON.stringify(observation));
const users = await d
  .collection("users")
  .find({}, { projection: { name: 1, role: 1, shebamedId: 1, professionalStatus: 1, demo: 1 } })
  .toArray();
console.log("USERS", users.length);
for (const user of users) console.log(JSON.stringify(user));
await connection().close();
