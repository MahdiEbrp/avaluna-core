import { IRAN, MONEY } from "../../config/constants";
import { rialsToToman } from "../../domain/iran";
import { fromMinorUnits, toMinorUnits, type MinorUnits } from "../../domain/money";
import { readMerged, type SettingMap } from "../settings/store";

export type MoneyProfile = {
  currency: string;
  scale: number;
  decimalPlaces: number;
  displayUnit: "toman" | "rial";
};

export function moneyProfile(map: SettingMap): MoneyProfile {
  const currency = readMerged(map, "general", "currency") || IRAN.CURRENCY;
  const displayUnit = readMerged(map, "general", "currency_unit") === "rial" ? "rial" : "toman";
  if (currency === "IRR" || currency === "IRT") {
    return { currency: "IRR", scale: 1, decimalPlaces: 0, displayUnit };
  }
  return {
    currency,
    scale: MONEY.SCALE,
    decimalPlaces: MONEY.DECIMAL_PLACES,
    displayUnit: "rial",
  };
}

export function toStoreMinor(value: string | number | null | undefined, profile: MoneyProfile): MinorUnits {
  return toMinorUnits(value, profile.scale);
}

export function fromStoreMinor(minor: MinorUnits, profile: MoneyProfile): string {
  return fromMinorUnits(minor, profile.scale, profile.decimalPlaces);
}

export function moneyPayload(minor: MinorUnits, profile: MoneyProfile) {
  return {
    currency: profile.currency,
    amount_minor: minor,
    amount: fromStoreMinor(minor, profile),
    amount_rial: profile.currency === "IRR" ? minor : null,
    amount_toman: profile.currency === "IRR" ? rialsToToman(minor) : null,
  };
}
