"use client";

import { Menu, Text, Tooltip, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI } from "../../config/constants";
import { localeSwitchHref, otherUiLocale, type UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = { locale: UiLocale };

export function LocaleSwitch({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const pathname = usePathname() || "/";
  const target = otherUiLocale(locale);
  const href = localeSwitchHref(target, pathname);
  return (
    <Tooltip label={t("nav.locale")}>
      <UnstyledButton
        component="a"
        href={href}
        aria-label={t("nav.locale")}
        data-testid="header.locale"
        className="shop-icon-btn"
        miw={UI.TOUCH_TARGET_MIN}
        mih={UI.TOUCH_TARGET_MIN}
      >
        <Text fw={700} size="sm" aria-hidden tabIndex={-1}>
          {t(`locale.${target}`)}
        </Text>
      </UnstyledButton>
    </Tooltip>
  );
}

export function AccountMenu({ locale }: { locale: UiLocale }) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton
          aria-label={t("shop.header.account")}
          data-testid="header.account"
          className="shop-icon-btn"
          miw={UI.TOUCH_TARGET_MIN}
          mih={UI.TOUCH_TARGET_MIN}
        >
          <Text fw={700} size="sm" aria-hidden tabIndex={-1}>
            {t("shop.header.account")}
          </Text>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("nav.account")}</Menu.Label>
        <Menu.Item component={Link} href="/account">
          {t("nav.account")}
        </Menu.Item>
        <Menu.Item component={Link} href="/cart">
          {t("nav.cart")}
        </Menu.Item>
        <Menu.Item component={Link} href="/intro">
          {t("shop.footer.intro")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function WishlistLink({ locale }: { locale: UiLocale }) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Tooltip label={t("shop.header.wishlist")}>
      <UnstyledButton
        component={Link}
        href="/wishlist"
        aria-label={t("shop.header.wishlist")}
        data-testid="header.wishlist"
        className="shop-icon-btn"
        miw={UI.TOUCH_TARGET_MIN}
        mih={UI.TOUCH_TARGET_MIN}
      >
        <Text fw={700} size="sm" aria-hidden tabIndex={-1}>
          {t("shop.header.wishlist")}
        </Text>
      </UnstyledButton>
    </Tooltip>
  );
}
