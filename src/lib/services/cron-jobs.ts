import { eq } from "drizzle-orm";
import { LOG } from "../../config/constants";
import { isCronExpression, nextCronUtcMs } from "../../domain/cron";
import { db } from "../db/client";
import { cronJobs } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";
import { drainOutbox } from "./outbox";

export async function createCronJob(input: { name: string; expression: string; handler: string }) {
  if (!isCronExpression(input.expression)) {
    throw new ApiError(400, "cron.invalid_expression", "Cron expression must have 5 fields (UTC).");
  }
  const next = nextCronUtcMs(input.expression, Date.now());
  const row = await db
    .insert(cronJobs)
    .values({
      name: input.name,
      expression: input.expression,
      handler: input.handler,
      nextRunAtMs: next,
      createdAt: nowIso(),
    })
    .returning();
  return requireInserted(row[0], "cron_job");
}

export async function listCronJobs() {
  return db.select().from(cronJobs);
}

export async function runCronJob(id: number, nowMs = Date.now()) {
  const job = (await db.select().from(cronJobs).where(eq(cronJobs.id, id)).limit(1))[0];
  if (!job) {
    throw new ApiError(404, "cron.not_found", "Cron job not found.");
  }
  if (job.handler === "outbox.drain") {
    await drainOutbox();
  }
  if (job.handler === LOG.CLEANUP_HANDLER) {
    const { cleanupAppLogs } = await import("../app-log");
    await cleanupAppLogs(nowMs);
  }
  const next = nextCronUtcMs(job.expression, nowMs);
  await db
    .update(cronJobs)
    .set({ lastRunAt: nowIso(), nextRunAtMs: next })
    .where(eq(cronJobs.id, id));
  return { id: job.id, handler: job.handler, ran_at: nowIso(), next_run_at_ms: next };
}

export async function tickCronJobs(nowMs = Date.now()) {
  const jobs = await db.select().from(cronJobs);
  const ran = [];
  for (const job of jobs) {
    if (!job.enabled) {
      continue;
    }
    if (job.nextRunAtMs !== null && job.nextRunAtMs > nowMs) {
      continue;
    }
    ran.push(await runCronJob(job.id, nowMs));
  }
  return { ran_count: ran.length, runs: ran };
}
