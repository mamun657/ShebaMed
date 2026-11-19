import { db, connection } from "../lib/db";

const d = await db();
const since = new Date(Date.now() - 60 * 60 * 1000);
const metrics = await d
  .collection("ai_usage_metrics")
  .find({ createdAt: { $gte: since } })
  .sort({ createdAt: -1 })
  .toArray();
const summary = metrics.reduce(
  (acc, metric) => {
    acc.calls += 1;
    acc.promptTokens += metric.promptTokens ?? 0;
    acc.completionTokens += metric.completionTokens ?? 0;
    if (metric.success) acc.success += 1;
    else acc.failure += 1;
    acc.byPurpose[metric.purpose] =
      (acc.byPurpose[metric.purpose] ?? 0) + 1;
    return acc;
  },
  {
    calls: 0,
    success: 0,
    failure: 0,
    promptTokens: 0,
    completionTokens: 0,
    byPurpose: {} as Record<string, number>,
  },
);
console.log("last 60 minutes:", JSON.stringify(summary, null, 2));
console.log("\nrecent entries:");
for (const metric of metrics.slice(0, 12))
  console.log(
    ` ${metric.purpose} success=${metric.success} prompt=${metric.promptTokens} completion=${metric.completionTokens} ms=${metric.durationMs}${metric.error ? " err=" + metric.error : ""}`,
  );
await connection().close();
process.exit(0);
