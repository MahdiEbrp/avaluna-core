import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SetupWizard } from "../../components/setup/SetupWizard";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../domain/ui-locale";
import { isSetupComplete } from "../../lib/services/setup";
import { noindexMetadata } from "../../lib/seo/metadata";
import { uiCopy } from "../../lib/locale/ui-copy";

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return noindexMetadata(locale, "/setup", { title: uiCopy(locale, "setup.title") });
}

export default async function SetupPage() {
  if (await isSetupComplete()) {
    redirect("/");
  }
  const locale = await currentLocale();
  return <SetupWizard locale={locale} />;
}
