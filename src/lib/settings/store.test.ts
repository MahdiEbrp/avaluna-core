import { describe, expect, it } from "vitest";
import { defaultsMap, isYes, mergeSettings, readMerged, settingKey } from "./store";
import { moneyPayload, moneyProfile, toStoreMinor, fromStoreMinor } from "../money/profile";
import { messageFa } from "../locale/messages-fa";

describe("settings and irr money", () => {
  it("merges catalog defaults with overrides", () => {
    expect(settingKey("general", "currency")).toBe("general.currency");
    expect(readMerged(defaultsMap(), "general", "timezone")).toBe("Asia/Tehran");
    const merged = mergeSettings({ "general.currency": "EUR" });
    expect(moneyProfile(merged).scale).toBe(100);
    const irr = moneyProfile(defaultsMap());
    expect(irr.currency).toBe("IRR");
    expect(irr.scale).toBe(1);
    expect(toStoreMinor(25000, irr)).toBe(25000);
    expect(fromStoreMinor(25000, irr)).toBe("25000");
    expect(moneyPayload(10000, irr).amount_toman).toBe(1000);
    expect(isYes("yes")).toBe(true);
    expect(isYes("no")).toBe(false);
    expect(messageFa("payments.verify_failed")).toContain("درگاه");
    expect(messageFa("unknown")).toBeNull();
    const rialDisplay = moneyProfile(mergeSettings({ "general.currency_unit": "rial" }));
    expect(rialDisplay.displayUnit).toBe("rial");
    expect(moneyPayload(10, moneyProfile(mergeSettings({ "general.currency": "EUR" }))).amount_rial).toBeNull();
  });
});
