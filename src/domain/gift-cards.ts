import type { MinorUnits } from "./money";

export type GiftCardDecision =
  | { ok: true; redeemMinor: MinorUnits; remainingMinor: MinorUnits }
  | { ok: false; reason: string };

export function redeemGiftCard(params: {
  balanceMinor: MinorUnits;
  amountDueMinor: MinorUnits;
  disabled: boolean;
  expiresAt: string | null;
  nowIso: string;
}): GiftCardDecision {
  if (params.disabled) {
    return { ok: false, reason: "gift_card_disabled" };
  }
  if (params.expiresAt && params.expiresAt < params.nowIso) {
    return { ok: false, reason: "gift_card_expired" };
  }
  if (params.balanceMinor <= 0) {
    return { ok: false, reason: "gift_card_empty" };
  }
  const redeemMinor = Math.min(params.balanceMinor, params.amountDueMinor);
  return { ok: true, redeemMinor, remainingMinor: params.balanceMinor - redeemMinor };
}

export function formatGiftCardCode(prefix: string, raw: string): string {
  return `${prefix}-${raw.toUpperCase()}`;
}
