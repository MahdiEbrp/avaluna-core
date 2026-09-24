import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { SECURITY, UI } from "../config/constants";
import { HomeEmpty } from "../components/shop/HomeEmpty";
import { HomeHero } from "../components/shop/HomeHero";
import { JsonLdScripts } from "../components/shop/JsonLdScripts";
import { CategoryTiles, ProductSection } from "../components/shop/ProductSection";
import { ShopShell } from "../components/shop/ShopShell";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../domain/ui-locale";
import { uiCopy } from "../lib/locale/ui-copy";
import { buildMetadata } from "../lib/seo/metadata";
import { itemListJsonLd, storeJsonLd } from "../lib/seo/json-ld";
import { loadHome } from "../lib/services/home";
import { loadShopChrome } from "../lib/services/shop-chrome";

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return buildMetadata(locale, {
    title: uiCopy(locale, "shop.home.title"),
    alternates: { canonical: "/", languages: { fa: `/?${UI.LANG_QUERY}=fa`, en: `/?${UI.LANG_QUERY}=en` } },
  });
}

export default async function HomePage() {
  const headerList = await headers();
  const locale = parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
  const nonce = headerList.get(SECURITY.CSP_NONCE_HEADER) ?? "";
  const t = (key: string) => uiCopy(locale, key);
  const [chrome, home] = await Promise.all([loadShopChrome(), loadHome()]);
  const base = t("meta.title");
  const graphs = [
    storeJsonLd({ name: t("nav.brand"), description: t("meta.description"), url: "/" }),
    itemListJsonLd({
      name: t("shop.home.featuredTitle"),
      url: "/",
      items: home.featured.map((product) => ({
        name: product.name,
        url: `/products/${product.slug}`,
      })),
    }),
  ];
  const empty = home.total === 0;
  return (
    <ShopShell locale={locale} categories={chrome.categories} legal={chrome.legal}>
      <JsonLdScripts nonce={nonce} graphs={graphs} />
      <HomeHero locale={locale} />
      {empty ? (
        <HomeEmpty locale={locale} />
      ) : (
        <>
          <CategoryTiles locale={locale} categories={home.categories} />
          <ProductSection
            locale={locale}
            title={t("shop.home.dealsTitle")}
            products={home.deals}
            profile={home.profile}
            testId="home.deals"
            viewAllHref="/products?on_sale=true"
          />
          <ProductSection
            locale={locale}
            title={t("shop.home.featuredTitle")}
            products={home.featured}
            profile={home.profile}
            testId="home.featured"
            viewAllHref="/products?featured=true"
          />
          {home.deals.length === 0 && home.featured.length === 0 ? <HomeEmpty locale={locale} /> : null}
        </>
      )}
      <span className="visually-hidden" data-testid="home.base">
        {base}
      </span>
    </ShopShell>
  );
}
