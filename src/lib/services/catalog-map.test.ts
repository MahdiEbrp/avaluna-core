import { describe, expect, it } from "vitest";
import {
  toApiBackorder,
  toApiStatus,
  toApiStock,
  toDbBackorder,
  toDbStatus,
  toDbStock,
  unitPriceMinor,
} from "./catalog-map";

describe("catalog-map", () => {
  it("maps status stock backorder and sale price", () => {
    expect(toApiStatus("publish")).toBe("published");
    expect(toApiStatus("draft")).toBe("draft");
    expect(toDbStatus("published")).toBe("publish");
    expect(toDbStatus("draft")).toBe("draft");
    expect(toApiStock("instock")).toBe("in_stock");
    expect(toApiStock("outofstock")).toBe("out_of_stock");
    expect(toApiStock("onbackorder")).toBe("on_backorder");
    expect(toApiStock("custom")).toBe("custom");
    expect(toDbStock("in_stock")).toBe("instock");
    expect(toDbStock("out_of_stock")).toBe("outofstock");
    expect(toDbStock("on_backorder")).toBe("onbackorder");
    expect(toDbStock("custom")).toBe("custom");
    expect(toDbBackorder("none")).toBe("no");
    expect(toDbBackorder("allow")).toBe("yes");
    expect(toDbBackorder("notify")).toBe("notify");
    expect(toApiBackorder("no")).toBe("none");
    expect(toApiBackorder("yes")).toBe("allow");
    expect(toApiBackorder("notify")).toBe("notify");
    expect(unitPriceMinor({ regularPriceCents: 10, salePriceCents: 7, onSale: true })).toBe(7);
    expect(unitPriceMinor({ regularPriceCents: 10, salePriceCents: 7, onSale: false })).toBe(10);
    expect(unitPriceMinor({ regularPriceCents: 10, salePriceCents: null, onSale: true })).toBe(10);
  });
});
