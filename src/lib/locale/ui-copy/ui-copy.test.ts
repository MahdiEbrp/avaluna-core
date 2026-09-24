import { describe, expect, it } from "vitest";
import { UI_LOCALES } from "../../../domain/ui-locale";
import { COMMON } from "./common";
import { LANDING } from "./landing";
import { SETUP } from "./setup";
import { SHOP } from "./shop";
import { copyCatalog, copyKeys, uiCopy } from "./index";

describe("ui-copy catalogs", () => {
  it("has identical key sets for every locale across merged catalogs", () => {
    const catalogs = { fa: copyCatalog("fa"), en: copyCatalog("en") };
    const faKeys = Object.keys(catalogs.fa).sort();
    const enKeys = Object.keys(catalogs.en).sort();
    expect(enKeys).toEqual(faKeys);
  });

  it("common and landing sources each have fa/en key parity", () => {
    for (const source of [COMMON, LANDING, SETUP, SHOP]) {
      const fa = Object.keys(source.fa).sort();
      const en = Object.keys(source.en).sort();
      expect(en).toEqual(fa);
    }
  });

  it("no empty copy values", () => {
    for (const locale of UI_LOCALES) {
      for (const key of copyKeys()) {
        expect(uiCopy(locale, key), `${locale}:${key}`).toBeTruthy();
        expect(uiCopy(locale, key).trim().length, `${locale}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("fa and en differ for translatable nav/meta titles", () => {
    expect(uiCopy("fa", "nav.brand")).not.toBe(uiCopy("en", "nav.brand"));
    expect(uiCopy("fa", "nav.skip")).not.toBe(uiCopy("en", "nav.skip"));
    expect(uiCopy("fa", "meta.description")).not.toBe(uiCopy("en", "meta.description"));
  });

  it("locale language names stay language-native in both locales", () => {
    expect(uiCopy("fa", "locale.fa")).toBe(uiCopy("en", "locale.fa"));
    expect(uiCopy("fa", "locale.en")).toBe(uiCopy("en", "locale.en"));
  });
});
