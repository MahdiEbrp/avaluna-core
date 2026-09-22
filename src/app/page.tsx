import { cookies, headers } from "next/headers";
import { LandingPage } from "../components/landing/LandingPage";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../domain/ui-locale";

export default async function Home() {
  const headerList = await headers();
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  return <LandingPage locale={locale} />;
}
