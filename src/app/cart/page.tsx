import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { CartView } from "../../components/shop/cart/CartView";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { moneyProfile } from "../../lib/money/profile";
import { noindexMetadata } from "../../lib/seo/metadata";
import { loadSettings } from "../../lib/settings/store";
import { loadShopChrome } from "../../lib/services/shop-chrome";

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return noindexMetadata(locale, "/cart", {
    title: uiCopy(locale, "shop.cart.title"),
  });
}

export default async function CartPage() {
  const locale = await currentLocale();
  const [chrome, settings] = await Promise.all([loadShopChrome(), loadSettings()]);
  const profile = moneyProfile(settings);
  return <CartView locale={locale} chrome={chrome} profile={profile} />;
}
