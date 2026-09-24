"use client";

import type { UiLocale } from "../../../domain/ui-locale";
import { plpHref, type PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  basePath: string;
  state: PlpQueryState;
  totalPages: number;
};

function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let n = start; n <= end; n += 1) pages.push(n);
  return pages;
}

export function PlpPagination({ locale, basePath, state, totalPages }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  if (totalPages <= 1) return null;
  const { page } = state;
  const pages = pageWindow(page, totalPages);

  return (
    <nav className="shop-plp__pagination" aria-label={t("shop.plp.pageOf")} data-testid="plp.pagination">
      {page > 1 ? (
        <a
          className="shop-plp__page-link"
          href={plpHref(basePath, state, { page: page - 1 }, { keepPage: true })}
          data-testid="plp.pagination.prev"
          rel="prev"
        >
          {t("shop.plp.prev")}
        </a>
      ) : null}
      <ul className="shop-plp__page-list">
        {pages.map((n) => (
          <li key={n}>
            <a
              className={n === page ? "shop-plp__page shop-plp__page--current" : "shop-plp__page"}
              href={plpHref(basePath, state, { page: n }, { keepPage: true })}
              aria-current={n === page ? "page" : undefined}
              data-testid={`plp.pagination.page.${n}`}
            >
              <span aria-hidden>{n}</span>
              <span className="visually-hidden">
                {t("shop.plp.pageOf")} {n}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {page < totalPages ? (
        <a
          className="shop-plp__page-link"
          href={plpHref(basePath, state, { page: page + 1 }, { keepPage: true })}
          data-testid="plp.pagination.next"
          rel="next"
        >
          {t("shop.plp.next")}
        </a>
      ) : null}
    </nav>
  );
}
