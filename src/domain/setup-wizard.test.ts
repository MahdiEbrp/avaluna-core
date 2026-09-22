import { describe, expect, it } from "vitest";
import { SETUP, UI } from "../config/constants";
import { emptySetupDraft, parseSetupDraft, setupProgressPercent, setupStepId, canAdvanceSetup } from "./setup-wizard";

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
});
