import type { UiLocale } from "../../../domain/ui-locale";
import { parsePlpQuery, plpHasActiveFilters, type PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { PlpData } from "../../../lib/services/plp";
import type { ShopChrome } from "../../../lib/services/shop-chrome";
import { ProductCard } from "../ProductCard";
import { ShopShell } from "../ShopShell";
import { PlpEmpty } from "./PlpEmpty";
import { PlpFilters } from "./PlpFilters";
import { PlpPagination } from "./PlpPagination";
import { PlpToolbar } from "./PlpToolbar";

type Props = {
  locale: UiLocale;
  basePath: string;
  chrome: ShopChrome;
  data: PlpData;
  title: string;
  lockCategory?: boolean;
  subtitle?: string;
};

export function PlpView({ locale, basePath, chrome, data, title, lockCategory = false, subtitle }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const state: PlpQueryState = { ...data.query };
  const empty = data.products.length === 0;
  const active = plpHasActiveFilters(state, lockCategory);

  return (
    <ShopShell locale={locale} categories={chrome.categories} legal={chrome.legal}>
      <div className="shop-plp" data-testid="plp.results">
        <div className="shop-plp__side">
          <PlpFilters
            locale={locale}
            basePath={basePath}
            state={state}
            categories={data.categories}
            profile={data.profile}
            priceRange={data.priceRange}
            lockCategory={lockCategory}
          />
        </div>
        <div className="shop-plp__main">
          <header className="shop-plp__head">
            <h1 data-testid="plp.title">{title}</h1>
            <p className="shop-plp__count" data-testid="plp.count">
              {subtitle ? `${subtitle} · ` : ""}
              {data.total} {t("shop.plp.unit")}
              {active ? ` · ${t("shop.plp.filters")}` : ""}
            </p>
          </header>
          <PlpToolbar locale={locale} basePath={basePath} state={state} />
          {empty ? (
            <PlpEmpty locale={locale} basePath={basePath} state={state} lockCategory={lockCategory} />
          ) : (
            <div className="shop-grid" data-testid="plp.grid">
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  locale={locale}
                  product={product}
                  profile={data.profile}
                  testId={`product.card.${product.id}`}
                />
              ))}
            </div>
          )}
          <PlpPagination locale={locale} basePath={basePath} state={state} totalPages={data.totalPages} />
        </div>
      </div>
    </ShopShell>
  );
}

export function rawPlpQuery(raw: Record<string, string | string[] | undefined>): PlpQueryState {
  return parsePlpQuery(raw);
}
