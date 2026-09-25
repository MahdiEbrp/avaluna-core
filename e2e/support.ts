import type { TestInfo } from "@playwright/test";

type HeaderTarget = { setExtraHTTPHeaders: (headers: Record<string, string>) => void };

let clientSeq = 0;

/**
 * The whole E2E suite is served from one machine, and the storefront rate-limits per client IP.
 * Give every test its own client IP so one spec can never exhaust another spec's bucket.
 * A single test still shares its own bucket, so the limiter itself stays exercised.
 */
export function useUniqueClientIp(target: HeaderTarget, testInfo: TestInfo): void {
  clientSeq += 1;
  const worker = testInfo.workerIndex % 256;
  const high = (clientSeq >> 8) & 255;
  const low = clientSeq & 255;
  target.setExtraHTTPHeaders({ "x-forwarded-for": `10.${worker}.${high}.${low}` });
}
