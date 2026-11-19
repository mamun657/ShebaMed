import { db, connection } from "../lib/db";
import { queryHistory } from "../lib/rag";

const d = await db();
const user = await d
  .collection("users")
  .findOne({ _id: new (await import("mongodb")).ObjectId("6af7fd234bce1b9ab1c6bd12") });
try {
  const result = await queryHistory(
    user!,
    String(user!._id),
    "Which laboratory tests were performed previously?",
    "English",
  );
  console.log(JSON.stringify(result).slice(0, 600));
} catch (error) {
  console.log("THREW:", error);
}
await connection().close();
process.exit(0);
