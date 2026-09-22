export function percentile(sortedMs: number[], p: number): number {
  if (sortedMs.length === 0) {
    return 0;
  }
  const rank = Math.min(sortedMs.length - 1, Math.max(0, Math.ceil((p / 100) * sortedMs.length) - 1));
  return sortedMs[rank] ?? 0;
}

export function isLocalStressBase(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "0.0.0.0");
  } catch {
    return false;
  }
}

export const STRESS_PATHS = ["/", "/?lang=en", "/api/services/v1/health", "/api/storefront/v1/products", "/api/storefront/v1/legal"] as const;
