import { describe, expect, it } from "vitest";
import { remainingAfterSale } from "./inventory";
import { statusAfterCheckout } from "./orders";
import { statusAfterCodDelivered } from "./cod";
import { assertOrigin, originAllowed } from "./csrf";
import { renderTemplate } from "./templates";
import { slugifyFa } from "./slug";
import { ftsMatchQuery } from "./search";
import { buildFacets } from "./catalog-facets";
import { generateOtpCode, issueOtp, resetOtpStore, verifyOtp } from "./otp";
import { signSession } from "./session-token";

describe("checkout payment paths", () => {
  it("zarinpal holds stock until verify; COD and card-to-card stay on_hold", () => {
    expect(statusAfterCheckout("zarinpal")).toBe("pending_payment");
    expect(statusAfterCheckout("cash_on_delivery")).toBe("on_hold");
    expect(statusAfterCheckout("card_to_card")).toBe("on_hold");
    const afterPay = remainingAfterSale(50, 2);
    expect(afterPay).toBe(48);
    expect(statusAfterCodDelivered("cash_on_delivery", "on_hold")).toBe("completed");
    expect(statusAfterCodDelivered("zarinpal", "processing")).toBe("completed");
  });
});

describe("otp login", () => {
  it("happy and sad paths", () => {
    resetOtpStore();
    const now = Date.UTC(2026, 5, 1, 12, 30, 45);
    const code = generateOtpCode(now);
    issueOtp("+989121234567", now, code);
    expect(verifyOtp("+989121234567", "000000", now)).toBe(false);
    expect(verifyOtp("+989121234567", code, now)).toBe(true);
    expect(signSession(1, now + 1000, "unit-test-session").split(".").length).toBe(3);
  });
});

describe("catalog helpers", () => {
  it("slug fts facets csrf", () => {
    expect(slugifyFa("تی شرت طلایی")).toContain("تی");
    expect(ftsMatchQuery("foo bar")).toContain("foo");
    expect(
      buildFacets([
        { categoryIds: [1], priceRial: 100, inStock: true },
        { categoryIds: [1, 2], priceRial: 50, inStock: false },
      ]).in_stock_count,
    ).toBe(1);
    expect(originAllowed(null, "", "localhost")).toBe(true);
    expect(originAllowed("https://evil.test", "https://shop.ir", "localhost")).toBe(false);
    expect(originAllowed("https://localhost:3000", "", "localhost:3000")).toBe(true);
    expect(originAllowed("bogus", "", "h")).toBe(false);
    expect(originAllowed("https://shop.ir", "https://shop.ir", "other")).toBe(true);
    expect(originAllowed("https://a.com", "%%%", "h")).toBe(false);
    expect(() => assertOrigin("https://evil.test", "https://shop.ir", "localhost")).toThrow();
    expect(buildFacets([]).total).toBe(0);
    expect(renderTemplate("nope" as "otp", "en", {})).toBe("nope");
    expect(renderTemplate("nope" as "otp", "fa", {})).toBe("nope");
    expect(() => assertOrigin(null, "", "localhost")).not.toThrow();
  });
});
