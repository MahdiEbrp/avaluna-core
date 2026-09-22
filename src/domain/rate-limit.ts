export type Bucket = { count: number; resetAtMs: number };

export function allowRequest(
  buckets: Map<string, Bucket>,
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number,
): boolean {
  const current = buckets.get(key);
  if (!current || current.resetAtMs < nowMs) {
    buckets.set(key, { count: 1, resetAtMs: nowMs + windowMs });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
}

export function clientIpFromHeaders(forwardedFor: string | null): string {
  return forwardedFor?.split(",")[0]?.trim() || "local";
}
