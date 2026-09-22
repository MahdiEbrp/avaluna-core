import { describe, expect, it } from "vitest";
import { dirForLocale, otherUiLocale, parseUiLocale } from "./ui-locale";
import { uiCopy } from "../lib/locale/ui-copy";

describe("ui locale", () => {
  it("defaults to fa rtl", () => {
    expect(parseUiLocale(undefined)).toBe("fa");
    expect(parseUiLocale("xx")).toBe("fa");
    expect(dirForLocale("fa")).toBe("rtl");
    expect(dirForLocale("en")).toBe("ltr");
    expect(otherUiLocale("fa")).toBe("en");
  });

  it("resolves copy by locale without falling to empty", () => {
    expect(uiCopy("fa", "hero.title")).toBeTruthy();
    expect(uiCopy("en", "hero.title")).toBeTruthy();
    expect(uiCopy("fa", "hero.title")).not.toBe(uiCopy("en", "hero.title"));
  });
});
