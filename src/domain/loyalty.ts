import { LOYALTY } from "../config/constants";
import type { MinorUnits } from "./money";
import { MONEY } from "../config/constants";

export function pointsEarnedForPurchase(totalMinor: MinorUnits): number {
  const major = Math.floor(totalMinor / MONEY.SCALE);
  return major * LOYALTY.POINTS_PER_MAJOR_UNIT;
}

export function discountMinorFromPoints(points: number): MinorUnits {
  return Math.max(0, points) * MONEY.SCALE;
}
