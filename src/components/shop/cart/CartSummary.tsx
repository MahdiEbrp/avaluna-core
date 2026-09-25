"use client";

import { Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import type { CartView } from "../../../lib/cart-client";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import { cartDisplay, cartUnitKey } from "./money";
import { PriceTag } from "../PriceTag";

type Props = {
  locale: UiLocale;
  view: CartView;
  profile: MoneyProfile;
};

export function CartSummary({ locale, view, profile }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const unit = cartUnitKey(profile);
  const totals = view.totals;

  return (
    <Stack className="shop-cart__summary" gap="md" data-testid="cart.summary">
      <Title order={2} className="shop-cart__summary-title">
        {t("shop.cart.summaryTitle")}
      </Title>
      <div className="shop-cart__totals" data-testid="cart.totals">
        <Group justify="space-between">
          <Text size="sm">{t("shop.cart.subtotal")}</Text>
          <PriceTag locale={locale} amount={cartDisplay(totals.items, profile)} unitKey={unit} size="sm" />
        </Group>
        <Group justify="space-between">
          <Text size="sm">{t("shop.cart.discount")}</Text>
          <PriceTag locale={locale} amount={cartDisplay(totals.discount, profile)} unitKey={unit} size="sm" />
        </Group>
        <Group justify="space-between">
          <Text size="sm">{t("shop.cart.shippingLabel")}</Text>
          <PriceTag locale={locale} amount={cartDisplay(totals.shipping, profile)} unitKey={unit} size="sm" />
        </Group>
        <Group justify="space-between">
          <Text size="sm">{t("shop.cart.taxLabel")}</Text>
          <PriceTag locale={locale} amount={cartDisplay(totals.tax, profile)} unitKey={unit} size="sm" />
        </Group>
        <Divider my="xs" />
        <Group justify="space-between" data-testid="cart.totals.grand">
          <Text fw={700}>{t("shop.cart.total")}</Text>
          <PriceTag locale={locale} amount={cartDisplay(totals.grand, profile)} unitKey={unit} size="lg" />
        </Group>
      </div>
      <Button component={Link} href="/checkout" fullWidth size="md" data-testid="cart.checkout">
        {t("shop.cart.checkoutCta")}
      </Button>
    </Stack>
  );
}
