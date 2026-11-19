import { db, connection } from "../lib/db";
const d = await db();
const users = await d
  .collection("users")
  .find({ name: "Acceptance Patient" }, { projection: { name: 1 } })
  .toArray();
console.log(JSON.stringify(users));
const docs = await d
  .collection("medical_documents")
  .find({ filename: /acceptance/ }, { projection: { patientId: 1, filename: 1 } })
  .toArray();
console.log(JSON.stringify(docs.map((doc) => ({ patientId: doc.patientId, filename: doc.filename }))));
await connection().close();
process.exit(0);
