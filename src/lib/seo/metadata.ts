import type { Metadata } from "next";
import { UI } from "../../config/constants";
import { uiCopy } from "../locale/ui-copy";

const DESCRIPTION_KEY = "meta.description";

export function buildMetadata(locale: "fa" | "en", overrides: Metadata = {}): Metadata {
  const base: Metadata = {
    title: {
      default: uiCopy(locale, "meta.title"),
      template: `%s · ${uiCopy(locale, "nav.brand")}`,
    },
    description: uiCopy(locale, DESCRIPTION_KEY),
    applicationName: uiCopy(locale, "nav.brand"),
    robots: { index: true, follow: true },
    alternates: { languages: { fa: `/?${UI.LANG_QUERY}=fa`, en: `/?${UI.LANG_QUERY}=en` } },
  };
  return { ...base, ...overrides };
}

export function noindexMetadata(locale: "fa" | "en", path: string, overrides: Metadata = {}): Metadata {
  return buildMetadata(locale, {
    robots: { index: false, follow: false },
    alternates: { canonical: path },
    ...overrides,
  });
}
