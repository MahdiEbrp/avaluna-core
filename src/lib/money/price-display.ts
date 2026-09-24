import { rialsToToman } from "../../domain/iran";
import type { MoneyProfile } from "../money/profile";

export function displayPrice(minor: number, profile: MoneyProfile): number {
  if (profile.currency === "IRR" && profile.displayUnit === "toman") {
    return rialsToToman(minor);
  }
  if (profile.scale === 1) return minor;
  return minor / profile.scale;
}

export function unitKey(profile: MoneyProfile): string {
  return profile.displayUnit === "toman" ? "money.toman" : "money.rial";
}

export function cardPriceMinor(card: {
  onSale: boolean;
  regularMinor: number;
  saleMinor: number | null;
}): number {
  if (card.onSale && card.saleMinor !== null) return card.saleMinor;
  return card.regularMinor;
}
