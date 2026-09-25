import { toMinorUnits } from "../../../domain/money";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import type { ShopChrome } from "../../../lib/services/shop-chrome";
import type { PdpData } from "../../../lib/services/pdp";
import { ProductSection } from "../ProductSection";
import { ShopShell } from "../ShopShell";
import { PdpBreadcrumbs } from "./PdpBreadcrumbs";
import { PdpBuyBox } from "./PdpBuyBox";
import { PdpTabs } from "./PdpTabs";

type Props = {
  locale: UiLocale;
  chrome: ShopChrome;
  data: PdpData;
};

export function PdpView({ locale, chrome, data }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const product = data.product;
  const name = locale === "fa" && product.name_fa ? product.name_fa : product.name;
  const summary = product.summary;
  const description = locale === "fa" && product.description_fa ? product.description_fa : product.description;
  const profile: MoneyProfile = data.profile;
  const regularMinor = toMinorUnits(product.pricing.regular_amount, profile.scale);
  const saleMinor =
    product.pricing.sale_amount !== null ? toMinorUnits(product.pricing.sale_amount, profile.scale) : null;
  const crumbs = [
    { label: t("shop.pdp.crumbHome"), href: "/" },
    { label: t("shop.pdp.crumbProducts"), href: "/products" },
    ...(data.primaryCategory
      ? [{ label: data.primaryCategory.name, href: `/categories/${data.primaryCategory.slug}` }]
      : []),
    { label: name },
  ];

  return (
    <ShopShell locale={locale} categories={chrome.categories} legal={chrome.legal}>
      <div className="shop-pdp" data-testid="pdp.view">
        <PdpBreadcrumbs locale={locale} crumbs={crumbs} />
        <div className="shop-pdp__layout">
          <div className="shop-pdp__primary">
            <h1 data-testid="pdp.title">{name}</h1>
            <PdpBuyBox
              locale={locale}
              productId={product.id}
              name={name}
              summary={summary}
              images={product.images}
              onSale={product.pricing.on_sale}
              regularMinor={regularMinor}
              saleMinor={saleMinor}
              stockStatus={product.inventory.status}
              stockQty={product.inventory.quantity}
              ratingAverage={product.rating.average}
              ratingCount={product.rating.count}
              sku={product.sku}
              profile={profile}
              codEnabled={data.codEnabled}
            />
            <PdpTabs
              locale={locale}
              productId={product.id}
              product={{
                description,
                sku: product.sku,
                weight: product.shipping.weight,
                dimensions: product.shipping.dimensions,
                tags: product.tags,
              }}
              reviews={data.reviews}
            />
          </div>
        </div>
        <ProductSection
          locale={locale}
          title={t("shop.pdp.relatedTitle")}
          products={data.related}
          profile={profile}
          testId="pdp.related"
        />
      </div>
    </ShopShell>
  );
}
