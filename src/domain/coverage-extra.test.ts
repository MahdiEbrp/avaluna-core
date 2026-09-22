import { describe, expect, it } from "vitest";
import { isAppSlug, canInstallApp } from "./apps";
import { availableToPromise, canTransfer, poReceivable } from "./atp";
import { creditAllows, volumeUnitMinor } from "./b2b";
import { expandKit, giftWrapMinor } from "./bundles";
import { quoteCarrier } from "./carriers";
import { cronMatchesUtc, nextCronUtcMs } from "./cron";
import { bxgyDiscountMinor, stackDiscounts } from "./discount-stack";
import { canConvertDraft, draftChannel, isDraftStatus } from "./draft-orders";
import { avsResult, shouldHoldOrder } from "./fraud";
import { canPortalReturn, canViewOrder } from "./portal";
import { canonicalUrl, sitemapUrlset } from "./seo";
import { eligibleRates, resolveSelectedRate } from "./shipping";
import {
  canTransitionSubscription,
  dunningBackoffHours,
  isSubscriptionStatus,
} from "./subscriptions";
import { nexusApplies, resolveTaxRegime } from "./tax-engine";
import { buildInvoice } from "./invoice";
import { legalSettingError } from "./legal-validate";
import { parsePage } from "./pagination";
import { renderTemplate } from "./templates";

describe("maximum branch coverage", () => {
  it("hits remaining domain branches", () => {
    expect(volumeUnitMinor(1, 500, [{ minQty: 10, unitMinor: 400 }])).toBe(500);
    expect(volumeUnitMinor(1, -5, [])).toBe(0);
    expect(creditAllows(10, 10, 1)).toBe(false);
    expect(quoteCarrier(0, "eu").days).toBe(5);
    expect(quoteCarrier(2500, "world").service).toBe("priority");
    expect(bxgyDiscountMinor(0, 1, 100, 5)).toBe(0);
    expect(
      stackDiscounts(
        [
          { kind: "shipping", amountMinor: 999, exclusive: true },
          { kind: "coupon", amountMinor: 5, exclusive: false },
        ],
        100,
        10,
      ),
    ).toBe(10);
    expect(isDraftStatus("nope")).toBe(false);
    expect(canConvertDraft("open")).toBe(true);
    expect(draftChannel("phone")).toBe("phone");
    expect(draftChannel("admin")).toBe("admin");
    expect(draftChannel("web")).toBe("admin");
    expect(avsResult(false, false)).toBe("fail");
    expect(avsResult(true, false)).toBe("partial");
    expect(avsResult(false, true)).toBe("partial");
    expect(shouldHoldOrder({ avs: "match", velocityHit: true, amountMinor: 1, holdAboveMinor: 9 })).toBe(true);
    expect(shouldHoldOrder({ avs: "partial", velocityHit: false, amountMinor: 9, holdAboveMinor: 9 })).toBe(true);
    expect(shouldHoldOrder({ avs: "match", velocityHit: false, amountMinor: 1, holdAboveMinor: 9 })).toBe(false);
    expect(isSubscriptionStatus("trial")).toBe(true);
    expect(isSubscriptionStatus("nope")).toBe(false);
    expect(canTransitionSubscription("active", "active")).toBe(true);
    expect(dunningBackoffHours(9)).toBe(168);
    expect(
      resolveTaxRegime({
        merchantCountry: "NL",
        customerCountry: "NL",
        digitalGood: false,
        orderMinor: 1,
        iossThresholdMinor: 15000,
        exemptionCode: "VAT-EX",
      }),
    ).toBe("exempt");
    expect(
      resolveTaxRegime({
        merchantCountry: "NL",
        customerCountry: "NL",
        digitalGood: false,
        orderMinor: 1,
        iossThresholdMinor: 15000,
      }),
    ).toBe("domestic");
    expect(
      resolveTaxRegime({
        merchantCountry: "US",
        customerCountry: "DE",
        digitalGood: false,
        orderMinor: 1000,
        iossThresholdMinor: 15000,
      }),
    ).toBe("ioss");
    expect(
      resolveTaxRegime({
        merchantCountry: "US",
        customerCountry: "US",
        digitalGood: true,
        orderMinor: 1,
        iossThresholdMinor: 1,
      }),
    ).toBe("domestic");
    expect(
      resolveTaxRegime({
        merchantCountry: "US",
        customerCountry: "JP",
        digitalGood: true,
        orderMinor: 99_999,
        iossThresholdMinor: 15000,
      }),
    ).toBe("export");
    expect(nexusApplies(["NL"], "DE")).toBe(false);
    expect(canViewOrder(1, null)).toBe(false);
    expect(canPortalReturn("processing")).toBe(true);
    expect(canPortalReturn("cancelled")).toBe(false);
    expect(canonicalUrl("https://a.shop/", "/p")).toBe("https://a.shop/p");
    expect(sitemapUrlset([{ loc: "https://x", lastmod: "2026-01-01" }])).toContain("2026-01-01");
    expect(cronMatchesUtc("0,30 * * * *", new Date(Date.UTC(2026, 0, 1, 0, 30)))).toBe(true);
    expect(cronMatchesUtc("*/0 * * * *", new Date(Date.UTC(2026, 0, 1, 0, 0)))).toBe(false);
    expect(nextCronUtcMs("0 0 31 2 *", Date.UTC(2026, 0, 1))).toBeNull();
    expect(parsePage(new URLSearchParams("page=-1&page_size=0")).page).toBe(1);
    expect(
      eligibleRates(
        [{ id: "f", methodId: "free_shipping", title: "F", costMinor: 0, minSubtotalMinor: null }],
        0,
      ),
    ).toHaveLength(1);
    expect(resolveSelectedRate([{ id: "a", methodId: "flat_rate", title: "A", costMinor: 1, minSubtotalMinor: null }], "a")?.id).toBe(
      "a",
    );
    expect(expandKit([], 0)).toEqual([]);
    expect(giftWrapMinor(true, 10, 0)).toBe(0);
    expect(availableToPromise(0, 0, 0, 1)).toBe(0);
    expect(canTransfer(1, 2)).toBe(false);
    expect(poReceivable(5, 5, 1)).toBe(false);
    expect(isAppSlug("A")).toBe(false);
    expect(canInstallApp(["x"], ["y"])).toBe(false);
    expect(legalSettingError("national_id", "123")).toBe("legal.invalid_national_id");
    expect(legalSettingError("sheba", "IR00")).toBe("legal.invalid_sheba");
    expect(legalSettingError("economic_code", "1")).toBe("legal.invalid_economic_code");
    expect(legalSettingError("store_name", "x")).toBeNull();
    expect(legalSettingError("national_id", "")).toBeNull();
    expect(renderTemplate("otp", "fa", { code: "1" })).toContain("1");
    expect(renderTemplate("otp", "en", { code: "1" })).toContain("1");
    expect(buildInvoice({
      number: "1",
      createdAt: "2024-03-20T00:00:00Z",
      totalRial: 10000,
      taxRial: 900,
      currency: "IRR",
      sheba: "",
      storeName: "Avaluna",
      returnDays: 7,
    }).jalali_date).toContain("1403");
  });
});
