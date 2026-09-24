import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { UI } from "../../../config/constants";
import { PlpView, rawPlpQuery } from "../../../components/shop/plp/PlpView";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";
import { buildMetadata } from "../../../lib/seo/metadata";
import { loadCategoryName, loadPlp } from "../../../lib/services/plp";
import { loadShopChrome } from "../../../lib/services/shop-chrome";

type SearchRaw = Record<string, string | string[] | undefined>;
type Params = { params: Promise<{ slug: string }> };

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await currentLocale();
  const { slug } = await params;
  const name = await loadCategoryName(slug);
  if (!name) return buildMetadata(locale, { title: uiCopy(locale, "shop.plp.title") });
  const path = `/categories/${slug}`;
  return buildMetadata(locale, {
    title: name,
    alternates: {
      canonical: path,
      languages: { fa: `${path}?${UI.LANG_QUERY}=fa`, en: `${path}?${UI.LANG_QUERY}=en` },
    },
  });
}

export default async function CategoryPage({ params, searchParams }: Params & { searchParams: Promise<SearchRaw> }) {
  const locale = await currentLocale();
  const { slug } = await params;
  const name = await loadCategoryName(slug);
  if (!name) notFound();
  const raw = await searchParams;
  const query = { ...rawPlpQuery(raw), category: slug };
  const [chrome, data] = await Promise.all([loadShopChrome(), loadPlp(query, locale)]);
  return (
    <PlpView
      locale={locale}
      basePath={`/categories/${slug}`}
      chrome={chrome}
      data={data}
      title={name}
      lockCategory
      subtitle={uiCopy(locale, "shop.nav.products")}
    />
  );
}
