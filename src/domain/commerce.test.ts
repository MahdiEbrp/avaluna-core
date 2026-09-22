import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cartLineKey } from "./cart-key";
import { evaluateCoupon, isDiscountType } from "./discounts";
import { signaturesMatch, signPayload } from "./hmac";
import { canFulfill, lineTotal, remainingAfterSale, stockStatusFromQuantity } from "./inventory";
import { addMinor, clampNonNegative, fromMinorUnits, percentOf, toMinorUnits } from "./money";
import {
  canTransition,
  formatOrderNumber,
  isOrderStatus,
  paymentSettlesImmediately,
  statusAfterCheckout,
} from "./orders";
import { offsetOf, pageCount, parsePage } from "./pagination";
import { allowRequest, clientIpFromHeaders } from "./rate-limit";
import { evaluateRefund } from "./refunds";
import { eligibleRates, resolveSelectedRate } from "./shipping";
import { sanitizeLikeTerm, slugify } from "./slug";
import { applyExclusiveTax, extractInclusiveTax } from "./tax";
import { productWriteSchema } from "../lib/services/catalog";
import { ApiError, jsonError } from "../lib/errors";
import { jsonOk, readJson } from "../lib/http";

describe("money", () => {
  it("converts display amounts to minor units without float drift", () => {
    expect(toMinorUnits("19.99")).toBe(1999);
    expect(fromMinorUnits(1999)).toBe("19.99");
    expect(fromMinorUnits(addMinor(1999, 495))).toBe("24.94");
    expect(toMinorUnits("")).toBe(0);
    expect(toMinorUnits(null)).toBe(0);
    expect(toMinorUnits("nope")).toBe(0);
    expect(toMinorUnits(10)).toBe(1000);
    expect(fromMinorUnits(undefined)).toBe("0.00");
    expect(clampNonNegative(-5)).toBe(0);
    expect(percentOf(10000, 10)).toBe(1000);
  });
});

describe("tax", () => {
  it("extracts 21% inclusive VAT from a gross amount", () => {
    const gross = 12100;
    const vat = extractInclusiveTax(gross, 2100);
    expect(vat).toBe(2100);
    expect(extractInclusiveTax(0)).toBe(0);
    expect(extractInclusiveTax(100, 0)).toBe(0);
  });
  it("applies exclusive tax", () => {
    expect(applyExclusiveTax(10000, 2100)).toBe(2100);
    expect(applyExclusiveTax(0)).toBe(0);
    expect(applyExclusiveTax(100, 0)).toBe(0);
  });
});

describe("coupons", () => {
  it("recognizes discount types", () => {
    expect(isDiscountType("percent")).toBe(true);
    expect(isDiscountType("nope")).toBe(false);
  });
  const base = {
    code: "save10",
    discountType: "percent" as const,
    amount: 10,
    usageLimit: 5,
    usageCount: 0,
    expiresAt: null as string | null,
    minimumSpendMinor: 1000,
    maximumSpendMinor: 100000,
  };
  it("applies percent off", () => {
    const result = evaluateCoupon(base, 5000, "2026-01-01T00:00:00.000Z");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discountMinor).toBe(500);
  });
  it("rejects expired, exhausted, min and max", () => {
    expect(evaluateCoupon({ ...base, expiresAt: "2020-01-01T00:00:00.000Z" }, 5000, "2026-01-01T00:00:00.000Z").ok).toBe(
      false,
    );
    expect(evaluateCoupon({ ...base, usageCount: 5 }, 5000, "2026-01-01T00:00:00.000Z").ok).toBe(false);
    expect(evaluateCoupon(base, 100, "2026-01-01T00:00:00.000Z").ok).toBe(false);
    expect(evaluateCoupon(base, 200000, "2026-01-01T00:00:00.000Z").ok).toBe(false);
  });
  it("applies fixed cart and clamps to subtotal", () => {
    const result = evaluateCoupon({ ...base, discountType: "fixed_cart", amount: 99999, minimumSpendMinor: null }, 500, "2026-01-01T00:00:00.000Z");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discountMinor).toBe(500);
  });
});

describe("orders", () => {
  it("allows legal transitions only", () => {
    expect(canTransition("pending_payment", "processing")).toBe(true);
    expect(canTransition("completed", "pending_payment")).toBe(false);
    expect(canTransition("completed", "completed")).toBe(true);
    expect(isOrderStatus("processing")).toBe(true);
    expect(isOrderStatus("nope")).toBe(false);
    expect(paymentSettlesImmediately("card")).toBe(true);
    expect(paymentSettlesImmediately("bank_transfer")).toBe(false);
    expect(statusAfterCheckout("bank_transfer")).toBe("on_hold");
    expect(statusAfterCheckout("card")).toBe("processing");
    expect(statusAfterCheckout("zarinpal")).toBe("pending_payment");
    expect(statusAfterCheckout("cash_on_delivery")).toBe("on_hold");
    expect(formatOrderNumber("AVL", 12)).toBe("AVL-00000012");
  });
});

describe("inventory", () => {
  it("enforces stock and backorders", () => {
    expect(canFulfill({ manageStock: false, quantityOnHand: 0, requested: 2, backorderPolicy: "none" })).toBe(true);
    expect(canFulfill({ manageStock: true, quantityOnHand: 2, requested: 2, backorderPolicy: "none" })).toBe(true);
    expect(canFulfill({ manageStock: true, quantityOnHand: 1, requested: 2, backorderPolicy: "none" })).toBe(false);
    expect(canFulfill({ manageStock: true, quantityOnHand: 1, requested: 2, backorderPolicy: "allow" })).toBe(true);
    expect(canFulfill({ manageStock: true, quantityOnHand: 1, requested: 0, backorderPolicy: "none" })).toBe(false);
    expect(remainingAfterSale(3, 5)).toBe(0);
    expect(stockStatusFromQuantity(1)).toBe("in_stock");
    expect(stockStatusFromQuantity(0)).toBe("out_of_stock");
    expect(lineTotal(1999, 2)).toBe(3998);
  });
});

describe("refunds", () => {
  it("validates remaining balance", () => {
    expect(evaluateRefund({ orderTotalMinor: 1000, alreadyRefundedMinor: 0, requestedMinor: 0 }).ok).toBe(false);
    expect(evaluateRefund({ orderTotalMinor: 1000, alreadyRefundedMinor: 200, requestedMinor: 900 }).ok).toBe(false);
    const full = evaluateRefund({ orderTotalMinor: 1000, alreadyRefundedMinor: 400, requestedMinor: 600 });
    expect(full.ok).toBe(true);
    if (full.ok) expect(full.fullyRefunded).toBe(true);
  });
});

describe("shipping", () => {
  const options = [
    { id: "flat:1", methodId: "flat_rate", title: "Flat", costMinor: 495, minSubtotalMinor: null },
    { id: "free:2", methodId: "free_shipping", title: "Free", costMinor: 0, minSubtotalMinor: 5000 },
  ];
  it("filters free shipping by threshold and picks selection", () => {
    expect(eligibleRates(options, 1000)).toHaveLength(1);
    expect(eligibleRates(options, 5000)).toHaveLength(2);
    expect(resolveSelectedRate([], null)).toBeNull();
    expect(resolveSelectedRate(options, "missing")?.id).toBe("flat:1");
    expect(resolveSelectedRate(options, "free:2")?.id).toBe("free:2");
  });
});

describe("pagination", () => {
  it("caps page size and computes offsets", () => {
    const parsed = parsePage(new URLSearchParams("page=2&page_size=500"));
    expect(parsed.pageSize).toBe(100);
    expect(parsed.page).toBe(2);
    expect(offsetOf(2, 10)).toBe(10);
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(25, 10)).toBe(3);
    expect(parsePage(new URLSearchParams("page=abc&per_page=xyz")).page).toBe(1);
  });
});

describe("slug and like", () => {
  it("slugifies and strips like wildcards", () => {
    expect(slugify("Classic Tee!")).toBe("classic-tee");
    expect(sanitizeLikeTerm("%_hi")).toBe("hi");
  });
});

describe("hmac", () => {
  it("signs and verifies with timing-safe compare", () => {
    const body = "{\"a\":1}";
    const sig = signPayload("secret", body);
    expect(sig).toBe(createHmac("sha256", "secret").update(body).digest("base64"));
    expect(signaturesMatch(sig, sig)).toBe(true);
    expect(signaturesMatch(sig, "aaaa")).toBe(false);
    expect(signaturesMatch("ab", "cd")).toBe(false);
  });
});

describe("rate-limit", () => {
  it("allows then blocks", () => {
    const buckets = new Map();
    expect(allowRequest(buckets, "k", 2, 1000, 10)).toBe(true);
    expect(allowRequest(buckets, "k", 2, 1000, 10)).toBe(true);
    expect(allowRequest(buckets, "k", 2, 1000, 10)).toBe(false);
    expect(allowRequest(buckets, "k", 2, 1000, 2000)).toBe(true);
    expect(clientIpFromHeaders("1.1.1.1, 2.2.2.2")).toBe("1.1.1.1");
    expect(clientIpFromHeaders(null)).toBe("local");
  });
});

describe("cart line key", () => {
  it("is stable per product and variation", () => {
    expect(cartLineKey(9, 1, null)).toBe(cartLineKey(9, 1, undefined));
    expect(cartLineKey(9, 1, 2)).not.toBe(cartLineKey(9, 1, 3));
    expect(cartLineKey(1, 1, null)).not.toBe(cartLineKey(2, 1, null));
  });
});

describe("catalog schema", () => {
  it("rejects unknown product types", () => {
    expect(() => productWriteSchema.parse({ type: "magic" })).toThrow();
    expect(productWriteSchema.parse({ name: "Hat", type: "simple" }).name).toBe("Hat");
  });
});

describe("http helpers", () => {
  it("serializes success and error payloads", async () => {
    expect(jsonOk({ ok: true }).status).toBe(200);
    const ok = jsonOk({ ok: true }, { total: 1, page: 1, pageSize: 10 });
    expect(ok.headers.get("X-Total-Count")).toBe("1");
    expect(ok.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const err = jsonError(new ApiError(404, "x", "nope"));
    expect(err.status).toBe(404);
    const internal = jsonError(new Error("boom"));
    expect(internal.status).toBe(500);
    const req = new Request("http://x", { method: "POST", body: "{\"a\":1}" });
    expect(await readJson(req)).toEqual({ a: 1 });
    await expect(readJson(new Request("http://x", { method: "POST", body: "not-json" }))).rejects.toBeInstanceOf(ApiError);
    expect(await readJson(new Request("http://x", { method: "POST", body: "" }))).toEqual({});
    await expect(
      readJson(new Request("http://x", { method: "POST", headers: { "content-length": "999999" }, body: "{}" })),
    ).rejects.toBeInstanceOf(ApiError);
    const huge = "x".repeat(70_000);
    await expect(readJson(new Request("http://x", { method: "POST", body: huge }))).rejects.toBeInstanceOf(ApiError);
    const per = jsonOk({ ok: true }, { total: 2, page: 1, perPage: 10 });
    expect(per.headers.get("X-Page-Size")).toBe("10");
  });
});

