"use client";

import { Button, Center, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
};

export function CartEmpty({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Center className="shop-cart__empty" mih="40vh" data-testid="cart.empty">
      <Stack align="center" gap="md" ta="center">
        <Title order={2} className="shop-cart__empty-title">
          {t("shop.cart.emptyTitle")}
        </Title>
        <Text maw="28rem">{t("shop.cart.emptyBody")}</Text>
        <Button component={Link} href="/products" variant="light" data-testid="cart.empty.continue">
          {t("shop.cart.continueShopping")}
        </Button>
      </Stack>
    </Center>
  );
}
