import { z } from "zod";
import { SECURITY, SETUP, UI } from "../config/constants";

export const SETUP_STEP_IDS = ["locale", "store", "operator", "payments", "review"] as const;
export type SetupStepId = (typeof SETUP_STEP_IDS)[number];

export const setupDraftSchema = z.object({
  locale: z.enum(["fa-IR", "en-IR"]),
  store_name: z.string().trim().min(1).max(80),
  store_name_fa: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  operator_email: z.email(),
  operator_name: z.string().trim().min(1).max(80),
  operator_password: z.string().min(SECURITY.PASSWORD_MIN_LENGTH).max(128),
  zarinpal_merchant_id: z.string().trim().max(64).optional().or(z.literal("")),
  sandbox: z.boolean(),
  enamad_code: z.string().trim().max(64).optional().or(z.literal("")),
});

export type SetupDraft = z.infer<typeof setupDraftSchema>;

export function emptySetupDraft(): SetupDraft {
  return {
    locale: "fa-IR",
    store_name: "Avaluna",
    store_name_fa: "آوالونا",
    city: "Tehran",
    operator_email: "",
    operator_name: "",
    operator_password: "",
    zarinpal_merchant_id: "",
    sandbox: true,
    enamad_code: "",
  };
}

export function setupStepId(index: number): SetupStepId {
  const clamped = Math.min(SETUP.LAST_STEP, Math.max(SETUP.FIRST_STEP, index));
  return SETUP_STEP_IDS[clamped] ?? "locale";
}

export function parseSetupDraft(input: unknown): SetupDraft {
  return setupDraftSchema.parse(input);
}

export function setupProgressPercent(index: number): number {
  return Math.round(((index + 1) / SETUP.STEP_COUNT) * UI.PERCENT_MAX);
}

export function canAdvanceSetup(step: number, draft: SetupDraft): boolean {
  if (step === SETUP.FIRST_STEP) {
    return true;
  }
  if (step === 1) {
    return Boolean(draft.store_name.trim() && draft.store_name_fa.trim() && draft.city.trim());
  }
  if (step === 2) {
    return (
      Boolean(draft.operator_name.trim()) &&
      draft.operator_email.includes("@") &&
      draft.operator_password.length >= SECURITY.PASSWORD_MIN_LENGTH
    );
  }
  return true;
}
