import { DISCOUNT_TYPES, type DiscountType } from "../config/constants";
import { clampNonNegative, percentOf, type MinorUnits } from "./money";

export type CouponRule = {
  code: string;
  discountType: DiscountType;
  amount: number;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  minimumSpendMinor: number | null;
  maximumSpendMinor: number | null;
};

export type CouponDecision =
  | { ok: true; discountMinor: MinorUnits }
  | { ok: false; reason: string };

export function isDiscountType(value: string): value is DiscountType {
  return (DISCOUNT_TYPES as readonly string[]).includes(value);
}

export function evaluateCoupon(
  rule: CouponRule,
  cartSubtotalMinor: MinorUnits,
  nowIso: string,
): CouponDecision {
  if (rule.expiresAt && rule.expiresAt < nowIso) {
    return { ok: false, reason: "coupon_expired" };
  }
  if (rule.usageLimit !== null && rule.usageLimit !== undefined && rule.usageCount >= rule.usageLimit) {
    return { ok: false, reason: "coupon_usage_exhausted" };
  }
  if (rule.minimumSpendMinor !== null && rule.minimumSpendMinor !== undefined && cartSubtotalMinor < rule.minimumSpendMinor) {
    return { ok: false, reason: "coupon_minimum_not_met" };
  }
  if (rule.maximumSpendMinor !== null && rule.maximumSpendMinor !== undefined && cartSubtotalMinor > rule.maximumSpendMinor) {
    return { ok: false, reason: "coupon_maximum_exceeded" };
  }

  let discount = 0;
  if (rule.discountType === "percent") {
    discount = percentOf(cartSubtotalMinor, rule.amount);
  } else {
    discount = rule.amount;
  }
  discount = Math.min(discount, cartSubtotalMinor);
  return { ok: true, discountMinor: clampNonNegative(discount) };
}
