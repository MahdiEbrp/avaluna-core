export type VolumeTier = { minQty: number; unitMinor: number };

export function volumeUnitMinor(quantity: number, listUnitMinor: number, tiers: VolumeTier[]): number {
  let price = listUnitMinor;
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  for (const tier of sorted) {
    if (quantity >= tier.minQty) {
      price = tier.unitMinor;
    }
  }
  return Math.max(0, price);
}

export function netDueMs(issuedMs: number, netDays: number): number {
  return issuedMs + Math.max(0, netDays) * 86_400_000;
}

export function creditAllows(limitMinor: number, outstandingMinor: number, orderMinor: number): boolean {
  return outstandingMinor + orderMinor <= limitMinor;
}
