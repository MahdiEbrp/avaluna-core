import { IRAN } from "../config/constants";
import type { MinorUnits } from "./money";

export function convertMinor(
  amountMinor: MinorUnits,
  fromRate: number,
  toRate: number,
): MinorUnits {
  if (fromRate <= 0 || toRate <= 0) {
    return amountMinor;
  }
  return Math.round((amountMinor / fromRate) * toRate);
}

export function isDefaultCurrency(code: string, defaultCode: string = IRAN.CURRENCY): boolean {
  return code === defaultCode;
}
