import { db, connection } from "../lib/db";
import { queryHistory } from "../lib/rag";

const d = await db();
const user = await d
  .collection("users")
  .findOne({ _id: new (await import("mongodb")).ObjectId("6af7fd234bce1b9ab1c6bd12") });
console.log("user:", user?.name, user?.role);

for (const question of ["hello", "Have I done an HbA1c test before?"]) {
  console.log("=== ", question);
  try {
    const result = await queryHistory(user!, String(user!._id), question, "English");
    console.log(JSON.stringify(result, null, 2).slice(0, 2000));
  } catch (error) {
    console.log("THREW:", error);
    console.log((error as Error).stack);
  }
}
await connection().close();
process.exit(0);
