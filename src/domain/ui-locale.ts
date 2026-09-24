import { UI } from "../config/constants";

export const UI_LOCALES = ["fa", "en"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const UI_LOCALE_COOKIE = UI.LOCALE_COOKIE;

export function parseUiLocale(raw: string | null | undefined): UiLocale {
  return raw === "en" ? "en" : UI.DEFAULT_LOCALE;
}

export function dirForLocale(locale: UiLocale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function otherUiLocale(locale: UiLocale): UiLocale {
  return locale === "fa" ? "en" : "fa";
}

export function localeSwitchHref(target: UiLocale, path = "/"): string {
  const base = path.startsWith("/") ? path : `/${path}`;
  return `${base}?${UI.LANG_QUERY}=${target}`;
}
