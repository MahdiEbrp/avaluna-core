import { RATE_LIMIT, STRESS, TIME } from "../src/config/constants";
import { isLocalStressBase, percentile, STRESS_PATHS } from "../src/domain/stress";

type Bucket = { ok: number; err: number; limited: number; times: number[] };

async function hit(base: string, path: string, timeoutMs: number): Promise<{ status: number; ms: number }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(new URL(path, base), { signal: controller.signal });
    await response.arrayBuffer();
    return { status: response.status, ms: Date.now() - started };
  } catch {
    return { status: 0, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function worker(base: string, until: number, buckets: Map<string, Bucket>) {
  while (Date.now() < until) {
    for (const path of STRESS_PATHS) {
      const result = await hit(base, path, STRESS.TIMEOUT_MS);
      const bucket = buckets.get(path);
      if (!bucket) {
        continue;
      }
      bucket.times.push(result.ms);
      if (result.status === 429) {
        bucket.limited += 1;
      } else if (result.status >= 200 && result.status < 400) {
        bucket.ok += 1;
      } else {
        bucket.err += 1;
      }
    }
  }
}

function summarize(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    n: sorted.length,
    p50: percentile(sorted, STRESS.PERCENTILE_P50),
    p95: percentile(sorted, STRESS.PERCENTILE_P95),
    p99: percentile(sorted, STRESS.PERCENTILE_P99),
  };
}

async function main() {
  const base = process.env.STRESS_BASE || STRESS.DEFAULT_BASE;
  if (!isLocalStressBase(base)) {
    throw new Error("stress.local_only");
  }
  const workers = Number(process.env.STRESS_WORKERS || STRESS.WORKERS);
  const durationMs = Number(process.env.STRESS_MS || STRESS.DURATION_MS);
  const buckets = new Map<string, Bucket>();
  for (const path of STRESS_PATHS) {
    buckets.set(path, { ok: 0, err: 0, limited: 0, times: [] });
  }
  const until = Date.now() + durationMs;
  await Promise.all(Array.from({ length: workers }, () => worker(base, until, buckets)));
  let ok = 0;
  let err = 0;
  let limited = 0;
  const allTimes: number[] = [];
  console.log(`stress ${base} workers=${workers} duration_ms=${durationMs}`);
  console.log(
    `rate_limits storefront=${RATE_LIMIT.STOREFRONT_PER_WINDOW} services=${RATE_LIMIT.SERVICES_PER_WINDOW} (429 expected under load)`,
  );
  for (const path of STRESS_PATHS) {
    const bucket = buckets.get(path);
    if (!bucket) {
      continue;
    }
    ok += bucket.ok;
    err += bucket.err;
    limited += bucket.limited;
    allTimes.push(...bucket.times);
    const stats = summarize(bucket.times);
    console.log(`${path} ok=${bucket.ok} err=${bucket.err} 429=${bucket.limited} p50=${stats.p50} p95=${stats.p95} p99=${stats.p99}`);
  }
  const total = summarize(allTimes);
  console.log(`total ok=${ok} err=${err} 429=${limited} p50=${total.p50} p95=${total.p95} p99=${total.p99} rps=${(allTimes.length / (durationMs / TIME.MS_PER_SECOND)).toFixed(1)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
