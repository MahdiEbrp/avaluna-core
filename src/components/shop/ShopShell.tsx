"use client";

import type { ReactNode } from "react";
import { UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { CartProvider } from "./CartProvider";
import { BottomNav } from "./BottomNav";
import { ShopFooter, type LegalInfo } from "./ShopFooter";
import { ShopHeader } from "./ShopHeader";
import { ShopNav, type NavCategory } from "./ShopNav";

type Props = {
  locale: UiLocale;
  categories: NavCategory[];
  legal: LegalInfo;
  children: ReactNode;
};

export function ShopShell({ locale, categories, legal, children }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <CartProvider>
      <a className="skip-link" href={`#${UI.SKIP_LINK_ID}`} data-testid="skip-link">
        {t("shop.a11y.skip")}
      </a>
      <div className="shop-shell" data-testid="shop.shell">
        <ShopHeader locale={locale} categories={categories} />
        <ShopNav locale={locale} categories={categories} />
        <main
          id={UI.SKIP_LINK_ID}
          tabIndex={-1}
          aria-label={t("shop.a11y.main")}
          data-testid="main"
          className="shop-main"
        >
          {children}
        </main>
        <ShopFooter locale={locale} legal={legal} />
        <BottomNav locale={locale} />
      </div>
    </CartProvider>
  );
}

export type { NavCategory, LegalInfo };
