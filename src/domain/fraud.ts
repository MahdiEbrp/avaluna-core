export type AvsResult = "match" | "partial" | "fail" | "unavailable";

export function avsResult(streetMatch: boolean, postcodeMatch: boolean): AvsResult {
  if (streetMatch && postcodeMatch) return "match";
  if (streetMatch || postcodeMatch) return "partial";
  return "fail";
}

export function velocityExceeded(ordersInWindow: number, maxOrders: number): boolean {
  return ordersInWindow > maxOrders;
}

export function shouldHoldOrder(params: {
  avs: AvsResult;
  velocityHit: boolean;
  amountMinor: number;
  holdAboveMinor: number;
}): boolean {
  if (params.velocityHit) return true;
  if (params.avs === "fail") return true;
  return params.amountMinor >= params.holdAboveMinor && params.avs !== "match";
}
