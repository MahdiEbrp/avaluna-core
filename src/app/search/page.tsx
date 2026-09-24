import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { PlpView, rawPlpQuery } from "../../components/shop/plp/PlpView";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { noindexMetadata } from "../../lib/seo/metadata";
import { loadPlp } from "../../lib/services/plp";
import { loadShopChrome } from "../../lib/services/shop-chrome";

type SearchRaw = Record<string, string | string[] | undefined>;

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchRaw> }): Promise<Metadata> {
  const locale = await currentLocale();
  const raw = await searchParams;
  const qValue = raw.q;
  const q = (Array.isArray(qValue) ? qValue[0] : qValue) ?? "";
  const path = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
  return noindexMetadata(locale, path, {
    title: uiCopy(locale, "shop.plp.searchTitle"),
  });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchRaw> }) {
  const locale = await currentLocale();
  const raw = await searchParams;
  const query = rawPlpQuery(raw);
  const [chrome, data] = await Promise.all([loadShopChrome(), loadPlp(query, locale)]);
  const title = query.search
    ? `${uiCopy(locale, "shop.plp.searchFor")} «${query.search}»`
    : uiCopy(locale, "shop.plp.searchTitle");
  return (
    <PlpView locale={locale} basePath="/search" chrome={chrome} data={data} title={title} />
  );
}
