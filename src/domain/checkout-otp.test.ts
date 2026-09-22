import { describe, expect, it } from "vitest";
import { checkoutIdentityIssue } from "./checkout-identity";
import { generateOtpCode, issueOtp, resetOtpStore, verifyOtp } from "./otp";
import { readSession, signSession } from "./session-token";

describe("checkout identity", () => {
  it("requires mobile and accepts guest by default flags", () => {
    const flags = { requireMobile: true, requireNationalId: false, guestOk: true, requireIdempotency: false };
    expect(checkoutIdentityIssue({}, flags, false, undefined)?.code).toBe("checkout.mobile_required");
    expect(checkoutIdentityIssue({ mobile: "09121234567" }, flags, false, undefined)).toBeNull();
    expect(
      checkoutIdentityIssue({ mobile: "09121234567" }, { ...flags, guestOk: false }, false, undefined)?.code,
    ).toBe("checkout.guest_forbidden");
    expect(
      checkoutIdentityIssue({ mobile: "09121234567" }, { ...flags, requireIdempotency: true }, false, undefined)?.code,
    ).toBe("checkout.idempotency_required");
    expect(
      checkoutIdentityIssue(
        { mobile: "09121234567", postcode: "12" },
        flags,
        false,
        undefined,
      )?.code,
    ).toBe("checkout.invalid_postcode");
    expect(
      checkoutIdentityIssue(
        { mobile: "09121234567", national_id: "123" },
        { ...flags, requireNationalId: true },
        false,
        undefined,
      )?.code,
    ).toBe("checkout.national_id_required");
    expect(
      checkoutIdentityIssue({ mobile: "09121234567", sheba: "IR00" }, flags, false, undefined)?.code,
    ).toBe("checkout.invalid_sheba");
  });
});

describe("otp and session", () => {
  it("issues and verifies then signs a session", () => {
    resetOtpStore();
    const now = Date.UTC(2026, 0, 1);
    const code = generateOtpCode(now);
    issueOtp("+989121234567", now, code);
    expect(issueOtp("+989121234567", now + 1_000, "999999").code).toBe(code);
    expect(verifyOtp("+989121234567", "000000", now)).toBe(false);
    expect(verifyOtp("+989121234567", code, now)).toBe(true);
    expect(verifyOtp("+989121234567", code, now)).toBe(false);
    const secret = "unit-test-session";
    const token = signSession(9, now + 60_000, secret);
    expect(readSession(token, now, secret)).toBe(9);
    expect(readSession(token, now + 120_000, secret)).toBeNull();
    expect(readSession("bad", now, secret)).toBeNull();
    expect(readSession(null, now, secret)).toBeNull();
    expect(() => signSession(1, now, "")).toThrow("session.secret_required");
  });
});
