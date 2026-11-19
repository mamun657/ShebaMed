import { randomUUID } from "node:crypto";
import {
  processNext,
  reconcileOrphanDocuments,
  expireStaleJobs,
  backfillChunkMetadata,
  workerHeartbeatMs,
} from "../lib/processing";
import { db, connection } from "../lib/db";

const workerId = `worker-${process.pid}-${randomUUID().slice(0, 8)}`;
let running = true;

const stop = (signal: string) => {
  console.log(`[worker] ${signal} received, finishing current job then exiting`);
  running = false;
};
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("[worker] unhandled rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("[worker] uncaught exception:", error);
});

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function heartbeat() {
  try {
    const d = await db();
    await d.collection("worker_heartbeats").updateOne(
      { workerId },
      {
        $set: {
          workerId,
          lastSeenAt: new Date(),
          status: "RUNNING",
        },
        $setOnInsert: { startedAt: new Date() },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error(
      "[worker] heartbeat failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

async function main() {
  console.log(`[worker] started ${workerId}`);
  await heartbeat();
  const beat = setInterval(() => void heartbeat(), workerHeartbeatMs);
  beat.unref();
  const requeued = await reconcileOrphanDocuments().catch(() => 0);
  if (requeued)
    console.log(`[worker] requeued ${requeued} document(s) without a live job`);
  const repaired = await backfillChunkMetadata().catch(() => 0);
  if (repaired)
    console.log(`[worker] repaired metadata on ${repaired} chunk(s)`);
  let idleTicks = 0;
  let consecutiveErrors = 0;
  while (running) {
    try {
      const worked = await processNext(workerId);
      consecutiveErrors = 0;
      if (worked) {
        idleTicks = 0;
        continue;
      }
      idleTicks += 1;
      if (idleTicks % 15 === 0) {
        await expireStaleJobs();
        await reconcileOrphanDocuments();
      }
      await sleep(2000);
    } catch (error) {
      consecutiveErrors += 1;
      console.error(
        "[worker] loop error:",
        error instanceof Error ? error.message : error,
      );
      const backoff = Math.min(30000, 1000 * 2 ** Math.min(consecutiveErrors, 5));
      await sleep(backoff);
    }
  }
  clearInterval(beat);
  const d = await db();
  await d
    .collection("worker_heartbeats")
    .updateOne(
      { workerId },
      { $set: { status: "STOPPED", lastSeenAt: new Date() } },
    )
    .catch(() => {});
  console.log("[worker] stopped");
  await connection().close();
  process.exit(0);
}

void main();
