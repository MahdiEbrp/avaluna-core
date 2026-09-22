import type { MinorUnits } from "./money";

export type RefundDecision =
  | { ok: true; amountMinor: MinorUnits; fullyRefunded: boolean }
  | { ok: false; reason: string };

export function evaluateRefund(params: {
  orderTotalMinor: MinorUnits;
  alreadyRefundedMinor: MinorUnits;
  requestedMinor: MinorUnits;
}): RefundDecision {
  if (params.requestedMinor <= 0) {
    return { ok: false, reason: "refund_amount_invalid" };
  }
  const remaining = params.orderTotalMinor - params.alreadyRefundedMinor;
  if (params.requestedMinor > remaining) {
    return { ok: false, reason: "refund_exceeds_remaining" };
  }
  const nextTotal = params.alreadyRefundedMinor + params.requestedMinor;
  return {
    ok: true,
    amountMinor: params.requestedMinor,
    fullyRefunded: nextTotal >= params.orderTotalMinor,
  };
}
