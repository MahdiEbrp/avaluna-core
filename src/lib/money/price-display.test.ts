import { describe, expect, it } from "vitest";
import type { MoneyProfile } from "./profile";
import { cardPriceMinor, displayPrice, unitKey } from "./price-display";

const irrToman: MoneyProfile = { currency: "IRR", scale: 1, decimalPlaces: 0, displayUnit: "toman" };
const irrRial: MoneyProfile = { currency: "IRR", scale: 1, decimalPlaces: 0, displayUnit: "rial" };
const eur: MoneyProfile = { currency: "EUR", scale: 100, decimalPlaces: 2, displayUnit: "rial" };

describe("price-display", () => {
  it("uses sale minor when on sale", () => {
    expect(cardPriceMinor({ onSale: true, regularMinor: 100, saleMinor: 80 })).toBe(80);
    expect(cardPriceMinor({ onSale: false, regularMinor: 100, saleMinor: 80 })).toBe(100);
    expect(cardPriceMinor({ onSale: true, regularMinor: 100, saleMinor: null })).toBe(100);
  });

  it("formats IRR by display unit", () => {
    expect(displayPrice(6_500_000, irrToman)).toBe(650_000);
    expect(displayPrice(6_500_000, irrRial)).toBe(6_500_000);
  });

  it("formats non-IRR by scale", () => {
    expect(displayPrice(1250, eur)).toBe(12.5);
  });

  it("maps unit copy keys", () => {
    expect(unitKey(irrToman)).toBe("money.toman");
    expect(unitKey(irrRial)).toBe("money.rial");
    expect(unitKey(eur)).toBe("money.rial");
  });
});
