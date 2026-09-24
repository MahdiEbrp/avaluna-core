"use client";

import { Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useState } from "react";
import type { UiLocale } from "../../domain/ui-locale";
import { addToCart } from "../../lib/cart-client";
import { uiCopy } from "../../lib/locale/ui-copy";
import { useCart } from "./CartProvider";

type Props = {
  locale: UiLocale;
  productId: number;
  outOfStock: boolean;
  compact?: boolean;
};

export function AddToCartButton({ locale, productId, outOfStock, compact = false }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const { refresh } = useCart();
  const [pending, setPending] = useState(false);

  const disabled = outOfStock || pending;
  const label = outOfStock
    ? t("shop.product.outOfStock")
    : pending
      ? t("shop.product.adding")
      : t("shop.product.add");

  async function handleClick() {
    if (disabled) return;
    setPending(true);
    try {
      const result = await addToCart(productId, 1);
      if (result.ok) {
        await refresh();
        showNotification({ color: "green", title: t("shop.product.added"), message: null });
      } else {
        showNotification({ color: "red", title: t("shop.product.addFailed"), message: null });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      fullWidth={!compact}
      size={compact ? "xs" : "sm"}
      disabled={disabled}
      loading={pending}
      onClick={() => void handleClick()}
      data-testid="product.add"
      aria-label={label}
    >
      {label}
    </Button>
  );
}
