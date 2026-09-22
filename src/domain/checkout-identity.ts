import { isIranMobile, isIranNationalId, isIranPostalCode, isIranSheba, normalizeIranMobile } from "./iran";

export type CheckoutFlags = {
  requireMobile: boolean;
  requireNationalId: boolean;
  guestOk: boolean;
  requireIdempotency: boolean;
};

export function checkoutIdentityIssue(
  billing: Record<string, string>,
  flags: CheckoutFlags,
  hasCustomer: boolean,
  idempotencyKey: string | undefined,
): { code: string; message: string } | null {
  if (!flags.guestOk && !hasCustomer) {
    return { code: "checkout.guest_forbidden", message: "Guest checkout is disabled." };
  }
  if (flags.requireIdempotency && !idempotencyKey) {
    return { code: "checkout.idempotency_required", message: "Idempotency-Key is required." };
  }
  const mobile = billing.mobile ?? billing.phone ?? "";
  if (flags.requireMobile && !isIranMobile(mobile)) {
    return { code: "checkout.mobile_required", message: "A valid Iranian mobile is required." };
  }
  const nid = billing.national_id ?? billing.nationalId ?? "";
  if (flags.requireNationalId && !isIranNationalId(nid)) {
    return { code: "checkout.national_id_required", message: "A valid national ID is required." };
  }
  const postcode = billing.postcode ?? billing.postal_code ?? "";
  if (postcode && !isIranPostalCode(postcode)) {
    return { code: "checkout.invalid_postcode", message: "Postal code must be 10 digits." };
  }
  const sheba = billing.sheba ?? "";
  if (sheba && !isIranSheba(sheba)) {
    return { code: "checkout.invalid_sheba", message: "Sheba is invalid." };
  }
  return null;
}

export function checkoutMobileE164(billing: Record<string, string>): string | null {
  return normalizeIranMobile(billing.mobile ?? billing.phone ?? "");
}
