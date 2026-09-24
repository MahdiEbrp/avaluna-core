import type { UiLocale } from "../../../domain/ui-locale";
import { COMMON } from "./common";
import { LANDING } from "./landing";
import { SETUP } from "./setup";
import { SHOP } from "./shop";

const CATALOG: Record<UiLocale, Record<string, string>> = {
  fa: { ...COMMON.fa, ...LANDING.fa, ...SETUP.fa, ...SHOP.fa },
  en: { ...COMMON.en, ...LANDING.en, ...SETUP.en, ...SHOP.en },
};

export function uiCopy(locale: UiLocale, key: string): string {
  return CATALOG[locale][key] ?? CATALOG.fa[key] ?? key;
}

export function copyCatalog(locale: UiLocale): Record<string, string> {
  return CATALOG[locale];
}

export function copyKeys(): string[] {
  return Object.keys(CATALOG.fa);
}
