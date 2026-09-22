import { describe, expect, it } from "vitest";
describe("fulfillment", () => {
  it("computes shipment progress", async () => {
    const { canShipQuantity, fulfillmentFromShipped, isFulfillmentStatus } = await import("./fulfillment");
    expect(fulfillmentFromShipped(4, 0)).toBe("unfulfilled");
    expect(fulfillmentFromShipped(4, 2)).toBe("partial");
    expect(fulfillmentFromShipped(4, 4)).toBe("fulfilled");
    expect(canShipQuantity(2, 2, 1)).toBe(false);
    expect(canShipQuantity(2, 0, 0)).toBe(false);
    expect(canShipQuantity(2, 0, 1)).toBe(true);
    expect(isFulfillmentStatus("partial")).toBe(true);
    expect(isFulfillmentStatus("nope")).toBe(false);
  });
});

describe("returns workflow", () => {
  it("enforces RMA transitions", async () => {
    const { canReturnQuantity, canTransitionReturn, isReturnStatus } = await import("./returns");
    expect(canTransitionReturn("requested", "approved")).toBe(true);
    expect(canTransitionReturn("rejected", "approved")).toBe(false);
    expect(canTransitionReturn("requested", "requested")).toBe(true);
    expect(canReturnQuantity(2, 1, 2)).toBe(false);
    expect(canReturnQuantity(2, 0, 0)).toBe(false);
    expect(isReturnStatus("approved")).toBe(true);
    expect(isReturnStatus("x")).toBe(false);
  });
});

describe("gift cards", () => {
  it("redeems up to remaining balance", async () => {
    const { formatGiftCardCode, redeemGiftCard } = await import("./gift-cards");
    expect(formatGiftCardCode("GIFT", "abc")).toBe("GIFT-ABC");
    expect(redeemGiftCard({ balanceMinor: 0, amountDueMinor: 100, disabled: false, expiresAt: null, nowIso: "2026-01-01" }).ok).toBe(false);
    expect(redeemGiftCard({ balanceMinor: 100, amountDueMinor: 100, disabled: true, expiresAt: null, nowIso: "2026-01-01" }).ok).toBe(false);
    expect(redeemGiftCard({ balanceMinor: 100, amountDueMinor: 100, disabled: false, expiresAt: "2020-01-01", nowIso: "2026-01-01" }).ok).toBe(false);
    const ok = redeemGiftCard({ balanceMinor: 500, amountDueMinor: 200, disabled: false, expiresAt: null, nowIso: "2026-01-01" });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.remainingMinor).toBe(300);
  });
});

describe("idempotency reservations payments pricing", () => {
  it("covers checkout safety primitives", async () => {
    const { decideIdempotency, isIdempotencyKeyValid } = await import("./idempotency");
    const { availableToSell, canReserve, isReservationActive, reservationExpiresAt } = await import("./reservation");
    const { canTransitionPayment, isPaymentIntentStatus } = await import("./payments");
    const { applyGroupPercent } = await import("./pricing");
    expect(decideIdempotency(undefined, "a")).toBe("accept");
    expect(decideIdempotency("a", "a")).toBe("replay");
    expect(decideIdempotency("a", "b")).toBe("conflict");
    expect(isIdempotencyKeyValid("short")).toBe(false);
    expect(isIdempotencyKeyValid("checkout-ok-1")).toBe(true);
    expect(availableToSell(10, 3)).toBe(7);
    expect(canReserve(5, 4, 2)).toBe(false);
    expect(canReserve(5, 1, 2)).toBe(true);
    expect(canReserve(5, 0, 0)).toBe(false);
    expect(isReservationActive(100, 90, false)).toBe(true);
    expect(isReservationActive(100, 101, false)).toBe(false);
    expect(isReservationActive(100, 90, true)).toBe(false);
    expect(reservationExpiresAt(10, 5)).toBe(15);
    expect(isPaymentIntentStatus("captured")).toBe(true);
    expect(isPaymentIntentStatus("nope")).toBe(false);
    expect(canTransitionPayment("requires_action", "authorized")).toBe(true);
    expect(canTransitionPayment("captured", "cancelled")).toBe(false);
    expect(canTransitionPayment("captured", "captured")).toBe(true);
    expect(applyGroupPercent(10000, 10)).toBe(9000);
    expect(applyGroupPercent(10000, 0)).toBe(10000);
    expect(applyGroupPercent(100, 200)).toBe(0);
  });
});

describe("loyalty currency search inventory ledger", () => {
  it("covers remaining commerce rules", async () => {
    const { pointsEarnedForPurchase, discountMinorFromPoints } = await import("./loyalty");
    const { convertMinor, isDefaultCurrency } = await import("./currency");
    const { searchTokens, scoreMatch } = await import("./search");
    const { isAbandoned } = await import("./abandoned-cart");
    const { applyMovement, isLowStock, transferDelta } = await import("./inventory-ledger");
    expect(pointsEarnedForPurchase(1999)).toBe(19);
    expect(discountMinorFromPoints(3)).toBe(300);
    expect(convertMinor(1000, 1, 1.1)).toBe(1100);
    expect(convertMinor(1000, 0, 1)).toBe(1000);
    expect(isDefaultCurrency("IRR")).toBe(true);
    expect(isDefaultCurrency("EUR")).toBe(false);
    expect(searchTokens("  classic tee ")).toEqual(["classic", "tee"]);
    expect(scoreMatch("classic", ["classic"])).toBe(10);
    expect(scoreMatch("classic-tee", ["classic"])).toBe(5);
    expect(scoreMatch("the classic", ["classic"])).toBe(2);
    expect(scoreMatch("other", ["zzz"])).toBe(0);
    expect(isAbandoned(new Date(Date.now() - 5 * 3600_000).toISOString(), Date.now(), 2)).toBe(true);
    expect(isAbandoned(new Date().toISOString(), Date.now(), 0)).toBe(false);
    expect(isAbandoned("bad", Date.now(), 1)).toBe(false);
    expect(applyMovement(5, -9)).toBe(0);
    expect(isLowStock(3, 5)).toBe(true);
    expect(transferDelta(4)).toEqual({ from: -4, to: 4 });
  });
});
