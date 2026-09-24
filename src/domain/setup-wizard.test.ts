import { describe, expect, it } from "vitest";
import { SETUP, UI } from "../config/constants";
import {
  canAdvanceSetup,
  emptySetupDraft,
  parseSetupDraft,
  setupProgressPercent,
  setupStepId,
} from "./setup-wizard";

describe("setup wizard", () => {
  it("parses drafts, clamps steps, and maps progress tokens", () => {
    expect(setupStepId(SETUP.FIRST_STEP)).toBe("locale");
    expect(setupStepId(SETUP.LAST_STEP)).toBe("review");
    expect(setupStepId(-3)).toBe("locale");
    expect(setupStepId(99)).toBe("review");
    expect(setupProgressPercent(SETUP.LAST_STEP)).toBe(UI.PERCENT_MAX);
    const draft = emptySetupDraft();
    expect(draft.locale).toBe("fa-IR");
    expect(() => parseSetupDraft({ ...draft, operator_email: "bad" })).toThrow();
    expect(
      parseSetupDraft({
        ...draft,
        operator_email: "ops@avaluna.ir",
        operator_name: "Ops",
        operator_password: "ChangeMeNow!",
      }).store_name_fa,
    ).toBe("آوالونا");
  });

  it("gates step advance from draft completeness", () => {
    const empty = emptySetupDraft();
    expect(canAdvanceSetup(SETUP.FIRST_STEP, empty)).toBe(true);
    expect(canAdvanceSetup(1, { ...empty, store_name: "", store_name_fa: "", city: "" })).toBe(false);
    expect(canAdvanceSetup(1, { ...empty, store_name: "S", store_name_fa: "فروشگاه", city: "Tehran" })).toBe(true);
    const operator = { ...empty, operator_name: "", operator_email: "", operator_password: "" };
    expect(canAdvanceSetup(2, operator)).toBe(false);
    expect(
      canAdvanceSetup(2, {
        ...empty,
        operator_name: "Ops",
        operator_email: "ops@avaluna.ir",
        operator_password: "ChangeMeNow!",
      }),
    ).toBe(true);
    expect(canAdvanceSetup(SETUP.LAST_STEP, empty)).toBe(true);
  });
});
