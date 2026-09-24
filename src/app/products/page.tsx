import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { UI } from "../../config/constants";
import { PlpView, rawPlpQuery } from "../../components/shop/plp/PlpView";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { buildMetadata } from "../../lib/seo/metadata";
import { loadPlp } from "../../lib/services/plp";
import { loadShopChrome } from "../../lib/services/shop-chrome";

type SearchRaw = Record<string, string | string[] | undefined>;

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  return buildMetadata(locale, {
    title: uiCopy(locale, "shop.plp.title"),
    alternates: {
      canonical: "/products",
      languages: { fa: `/products?${UI.LANG_QUERY}=fa`, en: `/products?${UI.LANG_QUERY}=en` },
    },
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchRaw> }) {
  const locale = await currentLocale();
  const raw = await searchParams;
  const query = rawPlpQuery(raw);
  const [chrome, data] = await Promise.all([loadShopChrome(), loadPlp(query, locale)]);
  return (
    <PlpView
      locale={locale}
      basePath="/products"
      chrome={chrome}
      data={data}
      title={uiCopy(locale, "shop.plp.title")}
    />
  );
}
