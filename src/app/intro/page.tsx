import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { LandingPage } from "../../components/landing/LandingPage";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../domain/ui-locale";
import { buildMetadata } from "../../lib/seo/metadata";

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await currentLocale());
}

export default async function IntroPage() {
  const locale = await currentLocale();
  return <LandingPage locale={locale} />;
}
