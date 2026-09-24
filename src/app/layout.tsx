import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { cookies, headers } from "next/headers";
import { SECURITY, UI } from "../config/constants";
import { UI_LOCALE_COOKIE, dirForLocale, parseUiLocale } from "../domain/ui-locale";
import { AppProviders } from "../components/AppProviders";
import { buildMetadata } from "../lib/seo/metadata";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  return buildMetadata(locale);
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const nonce = headerList.get(SECURITY.CSP_NONCE_HEADER) ?? "";
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  const dir = dirForLocale(locale);
  return (
    <html lang={locale} dir={dir} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript nonce={nonce} defaultColorScheme={UI.MANTINE_SCHEME} />
      </head>
      <body nonce={nonce}>
        <AppProviders nonce={nonce}>{children}</AppProviders>
      </body>
    </html>
  );
}
