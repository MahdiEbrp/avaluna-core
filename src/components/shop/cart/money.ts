import { toMinorUnits } from "../../../domain/money";
import { displayPrice, unitKey } from "../../../lib/money/price-display";
import type { MoneyProfile } from "../../../lib/money/profile";

export function cartDisplay(amount: string | number, profile: MoneyProfile): number {
  return displayPrice(toMinorUnits(amount, profile.scale), profile);
}

export function cartUnitKey(profile: MoneyProfile): string {
  return unitKey(profile);
}
