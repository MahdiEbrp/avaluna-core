"use client";

import { Indicator, Text, Tooltip, UnstyledButton } from "@mantine/core";
import Link from "next/link";
import { UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { useCart } from "./CartProvider";

type Props = { locale: UiLocale };

export function CartButton({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const { count } = useCart();
  const label = t("shop.header.cart");
  return (
    <Tooltip label={label}>
      <UnstyledButton
        component={Link}
        href="/cart"
        aria-label={`${label} ${count} ${t("shop.header.cartBadge")}`}
        data-testid="header.cart"
        className="shop-icon-btn"
        miw={UI.TOUCH_TARGET_MIN}
        mih={UI.TOUCH_TARGET_MIN}
      >
        <Indicator
          size="sm"
          color="brand"
          label={count > 0 ? String(count) : undefined}
          disabled={count === 0}
          data-testid={count > 0 ? "header.cart.badge" : undefined}
        >
          <Text fw={700} size="sm" aria-hidden tabIndex={-1}>
            {label}
          </Text>
        </Indicator>
      </UnstyledButton>
    </Tooltip>
  );
}
