import { describe, expect, it } from "vitest";
import { canInstallApp, isAppSlug } from "./apps";
import { availableToPromise, canTransfer, poReceivable } from "./atp";
import { volumeUnitMinor, creditAllows, netDueMs } from "./b2b";
import { expandKit, giftWrapMinor, optionSurchargeMinor } from "./bundles";
import { quoteCarrier, trackingUrl } from "./carriers";
import { bxgyDiscountMinor, stackDiscounts } from "./discount-stack";
import { canConvertDraft, draftChannel } from "./draft-orders";
import { avsResult, shouldHoldOrder, velocityExceeded } from "./fraud";
import { canPortalReturn, canViewOrder } from "./portal";
import { presentmentMinor, settlementMinorFromPresentment } from "./presentment";
import { canonicalUrl, productJsonLd, sitemapUrlset } from "./seo";
import { canTransitionSubscription, dunningBackoffHours, dunningExhausted, nextBillingAtMs } from "./subscriptions";
import { nexusApplies, resolveTaxRegime } from "./tax-engine";

describe("avaluna growth commerce", () => {
  it("subscriptions dunning and transitions", () => {
    expect(canTransitionSubscription("active", "paused")).toBe(true);
    expect(canTransitionSubscription("cancelled", "active")).toBe(false);
    expect(dunningBackoffHours(1)).toBe(24);
    expect(dunningBackoffHours(2)).toBe(72);
    expect(dunningExhausted(4, 4)).toBe(true);
    expect(nextBillingAtMs(0, 30)).toBe(30 * 86_400_000);
  });

  it("kits options wrap drafts b2b tax carriers fraud", () => {
    expect(expandKit([{ productId: 1, quantity: 2 }], 3)).toEqual([{ productId: 1, quantity: 6 }]);
    expect(optionSurchargeMinor(1000, [{ surchargeMinor: 200 }])).toBe(1200);
    expect(giftWrapMinor(true, 150, 2)).toBe(300);
    expect(giftWrapMinor(false, 150, 2)).toBe(0);
    expect(canConvertDraft("draft")).toBe(true);
    expect(draftChannel("pos")).toBe("pos");
    expect(volumeUnitMinor(10, 500, [{ minQty: 5, unitMinor: 400 }])).toBe(400);
    expect(creditAllows(1000, 400, 500)).toBe(true);
    expect(netDueMs(0, 30)).toBe(30 * 86_400_000);
    expect(resolveTaxRegime({ merchantCountry: "NL", customerCountry: "DE", digitalGood: false, orderMinor: 1000, iossThresholdMinor: 15000 }).length).toBe(3);
    expect(nexusApplies(["NL", "DE"], "DE")).toBe(true);
    expect(quoteCarrier(500, "domestic").carrier).toBe("avaluna_post");
    expect(trackingUrl("avaluna_post", "X")).toContain("X");
    expect(avsResult(true, true)).toBe("match");
    expect(velocityExceeded(6, 5)).toBe(true);
    expect(shouldHoldOrder({ avs: "fail", velocityHit: false, amountMinor: 1, holdAboveMinor: 100 })).toBe(true);
  });

  it("discounts atp fx portal seo apps", () => {
    expect(bxgyDiscountMinor(2, 1, 100, 4)).toBe(200);
    expect(stackDiscounts([{ kind: "coupon", amountMinor: 50, exclusive: false }], 100, 10)).toBe(50);
    expect(availableToPromise(10, 2, 5, 1)).toBe(12);
    expect(canTransfer(3, 2)).toBe(true);
    expect(poReceivable(10, 4, 6)).toBe(true);
    expect(presentmentMinor(1000, 1, 1.1)).toBe(1100);
    expect(settlementMinorFromPresentment(1100, 1.1, 1)).toBe(1000);
    expect(canViewOrder(1, 1)).toBe(true);
    expect(canPortalReturn("completed")).toBe(true);
    expect(canonicalUrl("https://a.shop", "p")).toBe("https://a.shop/p");
    expect((productJsonLd({ name: "Hat", url: "u", amount: "1.00", currency: "EUR" }) as { name: string }).name).toBe("Hat");
    expect(sitemapUrlset([{ loc: "https://x" }])).toContain("https://x");
    expect(isAppSlug("avaluna-reviews")).toBe(true);
    expect(canInstallApp(["read"], ["read", "write"])).toBe(true);
  });
});
