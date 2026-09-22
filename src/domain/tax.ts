import { TAX } from "../config/constants";
import type { MinorUnits } from "./money";

/** Inclusive tax: extract VAT already contained in a gross amount. */
export function extractInclusiveTax(grossMinor: MinorUnits, rateBps: number = TAX.DEFAULT_RATE_BPS): MinorUnits {
  if (grossMinor <= 0 || rateBps <= 0) {
    return 0;
  }
  return Math.round((grossMinor * rateBps) / (TAX.BPS_DENOMINATOR + rateBps));
}

export function applyExclusiveTax(netMinor: MinorUnits, rateBps: number = TAX.DEFAULT_RATE_BPS): MinorUnits {
  if (netMinor <= 0 || rateBps <= 0) {
    return 0;
  }
  return Math.round((netMinor * rateBps) / TAX.BPS_DENOMINATOR);
}
