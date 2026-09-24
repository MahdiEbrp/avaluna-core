"use client";

import { Group, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { CartButton } from "./CartButton";
import { AccountMenu, LocaleSwitch, WishlistLink } from "./HeaderActions";
import { MobileMenu, type NavCategory } from "./ShopNav";
import { SearchBar } from "./SearchBar";

type Props = {
  locale: UiLocale;
  categories: NavCategory[];
};

export function ShopHeader({ locale, categories }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <header className="shop-header" aria-label={t("shop.a11y.header")} data-testid="shop.header">
      <Group h="100%" px="md" justify="space-between" wrap="nowrap" gap="sm">
        <Group wrap="nowrap" gap="xs">
          <MobileMenu locale={locale} categories={categories} />
          <UnstyledButton
            component={Link}
            href="/"
            aria-label={t("nav.brand")}
            data-testid="header.logo"
            className="shop-logo"
          >
            <Text fw={800} size="lg">
              {t("nav.brand")}
            </Text>
          </UnstyledButton>
        </Group>
        <div className="shop-header-search">
          <SearchBar locale={locale} />
        </div>
        <Group wrap="nowrap" gap="xs">
          <LocaleSwitch locale={locale} />
          <WishlistLink locale={locale} />
          <AccountMenu locale={locale} />
          <CartButton locale={locale} />
        </Group>
      </Group>
    </header>
  );
}
