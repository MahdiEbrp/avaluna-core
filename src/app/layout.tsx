import "@mantine/core/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { cookies, headers } from "next/headers";
import { SECURITY, UI } from "../config/constants";
import { UI_LOCALE_COOKIE, dirForLocale, parseUiLocale } from "../domain/ui-locale";
import { uiCopy } from "../lib/locale/ui-copy";
import { mantineTheme } from "../lib/mantine-theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  return {
    title: uiCopy(locale, "meta.title"),
    description: uiCopy(locale, "meta.description"),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const nonce = headerList.get(SECURITY.CSP_NONCE_HEADER) ?? undefined;
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  const dir = dirForLocale(locale);
  return (
    <html lang={locale} dir={dir} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript nonce={nonce} defaultColorScheme={UI.MANTINE_SCHEME} />
      </head>
      <body nonce={nonce}>
        <MantineProvider theme={mantineTheme} defaultColorScheme={UI.MANTINE_SCHEME} forceColorScheme={UI.MANTINE_SCHEME}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
