import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { SECURITY, UI } from "../../../config/constants";
import { productJsonLd } from "../../../domain/seo";
import { UI_LOCALE_COOKIE, parseUiLocale } from "../../../domain/ui-locale";
import { JsonLdScripts } from "../../../components/shop/JsonLdScripts";
import { PdpView } from "../../../components/shop/pdp/PdpView";
import { uiCopy } from "../../../lib/locale/ui-copy";
import { buildMetadata } from "../../../lib/seo/metadata";
import { loadPdp } from "../../../lib/services/pdp";
import { loadShopChrome } from "../../../lib/services/shop-chrome";

type Params = { params: Promise<{ slug: string }> };

async function currentLocale() {
  const headerList = await headers();
  return parseUiLocale(headerList.get("x-avaluna-locale") ?? (await cookies()).get(UI_LOCALE_COOKIE)?.value);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await currentLocale();
  const { slug } = await params;
  const data = await loadPdp(slug, locale);
  if (!data) return buildMetadata(locale, { title: uiCopy(locale, "shop.plp.title") });
  const name = locale === "fa" && data.product.name_fa ? data.product.name_fa : data.product.name;
  const path = `/products/${data.product.slug}`;
  const image = data.product.images[0]?.src;
  return buildMetadata(locale, {
    title: name,
    description: data.product.summary || uiCopy(locale, "meta.description"),
    alternates: {
      canonical: path,
      languages: { fa: `${path}?${UI.LANG_QUERY}=fa`, en: `${path}?${UI.LANG_QUERY}=en` },
    },
    openGraph: {
      title: name,
      description: data.product.summary || uiCopy(locale, "meta.description"),
      images: image ? [{ url: image }] : undefined,
    },
  });
}

export default async function ProductDetailPage({ params }: Params) {
  const locale = await currentLocale();
  const { slug } = await params;
  const headerList = await headers();
  const nonce = headerList.get(SECURITY.CSP_NONCE_HEADER) ?? "";
  const [chrome, data] = await Promise.all([loadShopChrome(), loadPdp(slug, locale)]);
  if (!data) notFound();
  const name = locale === "fa" && data.product.name_fa ? data.product.name_fa : data.product.name;
  const graph = productJsonLd({
    name,
    url: `/products/${data.product.slug}`,
    amount: data.product.pricing.amount,
    currency: data.product.pricing.currency,
  });

  return (
    <>
      <JsonLdScripts nonce={nonce} graphs={[graph]} />
      <PdpView locale={locale} chrome={chrome} data={data} />
    </>
  );
}
