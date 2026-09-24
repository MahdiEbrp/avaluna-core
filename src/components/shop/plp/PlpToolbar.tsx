"use client";

import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import { PLP_SORT_KEYS, plpHref, type PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  basePath: string;
  state: PlpQueryState;
};

const SORT_LABEL_KEYS: Record<string, string> = {
  newest: "shop.plp.sort.newest",
  price_asc: "shop.plp.sort.priceAsc",
  price_desc: "shop.plp.sort.priceDesc",
  rating: "shop.plp.sort.rating",
  name: "shop.plp.sort.name",
};

export function PlpToolbar({ locale, basePath, state }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <div className="shop-plp__toolbar" data-testid="plp.toolbar">
      <div className="shop-plp__chips" data-testid="plp.sort" role="group" aria-label={t("shop.plp.sortLabel")}>
        {PLP_SORT_KEYS.map((key) => (
          <Link
            key={key}
            href={plpHref(basePath, state, { sortKey: key })}
            className={state.sortKey === key ? "shop-chip shop-chip--active" : "shop-chip"}
            data-testid={`plp.sort.${key}`}
            aria-current={state.sortKey === key ? "true" : undefined}
          >
            {t(SORT_LABEL_KEYS[key] ?? "shop.plp.sort.newest")}
          </Link>
        ))}
      </div>
      <div className="shop-plp__chips" data-testid="plp.filter.toggles">
        <Link
          href={plpHref(basePath, state, { onSale: !state.onSale })}
          className={state.onSale ? "shop-chip shop-chip--active" : "shop-chip"}
          data-testid="plp.filter.on_sale"
          aria-pressed={state.onSale}
        >
          {t("shop.plp.onSale")}
        </Link>
        <Link
          href={plpHref(basePath, state, { inStock: !state.inStock })}
          className={state.inStock ? "shop-chip shop-chip--active" : "shop-chip"}
          data-testid="plp.filter.in_stock"
          aria-pressed={state.inStock}
        >
          {t("shop.plp.inStock")}
        </Link>
      </div>
    </div>
  );
}
