"use client";

import { Group, Text, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { useCart } from "./CartProvider";

type Props = { locale: UiLocale };

export function BottomNav({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const pathname = usePathname();
  const { count } = useCart();
  const items = [
    { key: "home", href: "/", label: t("shop.bottom.home") },
    { key: "categories", href: "/products", label: t("shop.bottom.categories") },
    { key: "cart", href: "/cart", label: t("shop.bottom.cart"), badge: count },
    { key: "account", href: "/account", label: t("shop.bottom.account") },
  ] as const;

  return (
    <nav
      aria-label={t("shop.a11y.bottomNav")}
      data-testid="bottom.nav"
      className="shop-bottom-nav shop-bottom-nav--responsive"
    >
      <Group justify="space-around" wrap="nowrap" w="100%" h="100%">
        {items.map((item) => (
          <UnstyledButton
            key={item.key}
            component={Link}
            href={item.href}
            className="shop-bottom-item"
            aria-label={item.label}
            aria-current={pathname === item.href ? "page" : undefined}
            data-testid={`bottom.${item.key}`}
            miw={UI.TOUCH_TARGET_MIN}
            mih={UI.TOUCH_TARGET_MIN}
          >
            <Text size="xs" fw={pathname === item.href ? 700 : 500} aria-hidden tabIndex={-1}>
              {item.label}
            </Text>
            {"badge" in item && item.badge > 0 ? (
              <Text size="xs" c="brand" fw={700} data-testid="bottom.cart.badge">
                {item.badge}
              </Text>
            ) : null}
          </UnstyledButton>
        ))}
      </Group>
    </nav>
  );
}
