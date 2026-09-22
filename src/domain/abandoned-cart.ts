import { CART_ABANDONED_AFTER_HOURS } from "../config/constants";

export function isAbandoned(updatedAtIso: string, nowMs: number, itemCount: number): boolean {
  if (itemCount < 1) {
    return false;
  }
  const updated = Date.parse(updatedAtIso);
  if (!Number.isFinite(updated)) {
    return false;
  }
  const ageHours = (nowMs - updated) / (60 * 60 * 1000);
  return ageHours >= CART_ABANDONED_AFTER_HOURS;
}
