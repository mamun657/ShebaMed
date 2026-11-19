import {
  reconcileOrphanDocuments,
  expireStaleJobs,
  documentProcessingSummary,
  backfillChunkMetadata,
} from "../lib/processing";
import { connection } from "../lib/db";

const requeued = await reconcileOrphanDocuments();
const stale = await expireStaleJobs();
const repaired = await backfillChunkMetadata();
const summary = await documentProcessingSummary();
console.log(
  `[reconcile] requeued ${requeued} document(s), released ${stale} stale lease(s)`,
);
console.log(`[reconcile] backfilled metadata on ${repaired} chunk(s)`);
console.log(
  "[reconcile] document statuses:",
  JSON.stringify(summary),
);
await connection().close();
process.exit(0);
