import { clampNonNegative } from "./money";

export function applyGroupPercent(unitMinor: number, discountPercent: number): number {
  if (discountPercent <= 0) {
    return clampNonNegative(unitMinor);
  }
  const bps = Math.min(10_000, Math.round(discountPercent * 100));
  return clampNonNegative(unitMinor - Math.round((unitMinor * bps) / 10_000));
}
