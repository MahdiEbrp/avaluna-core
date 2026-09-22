import { RATE_LIMIT } from "../config/constants";
import { clientIpFromHeaders } from "../domain/rate-limit";
import { connector } from "./db/client";
import { migrate } from "./db/migrate";

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number = RATE_LIMIT.WINDOW_MS,
): Promise<boolean> {
  await migrate();
  const now = Date.now();
  const existing = await connector.execute({
    sql: "SELECT count, reset_at_ms FROM rate_buckets WHERE key = ?",
    args: [key],
  });
  const row = existing.rows[0] as unknown as { count: number; reset_at_ms: number } | undefined;
  let count = 1;
  let resetAt = now + windowMs;
  if (!row || Number(row.reset_at_ms) < now) {
    count = 1;
    resetAt = now + windowMs;
  } else if (Number(row.count) >= limit) {
    return false;
  } else {
    count = Number(row.count) + 1;
    resetAt = Number(row.reset_at_ms);
  }
  await connector.execute({
    sql: `INSERT INTO rate_buckets(key, count, reset_at_ms) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET count = excluded.count, reset_at_ms = excluded.reset_at_ms`,
    args: [key, count, resetAt],
  });
  return true;
}

export function clientIp(request: Request): string {
  return clientIpFromHeaders(request.headers.get("x-forwarded-for"));
}
