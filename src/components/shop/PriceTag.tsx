"use client";

import { Text } from "@mantine/core";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  amount: number;
  regularAmount?: number | null;
  unitKey?: string;
  showUnit?: boolean;
  size?: "sm" | "md" | "lg";
};

export function PriceTag({
  locale,
  amount,
  regularAmount,
  unitKey = "money.toman",
  showUnit = true,
  size = "md",
}: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const unit = t(unitKey);
  const onSale = regularAmount !== undefined && regularAmount !== null && regularAmount > amount;
  const localeNum = locale === "fa" ? "fa-IR" : "en-US";
  return (
    <div className="shop-price">
      <Text fw={700} size={size} className="shop-price__current" data-testid="product.price">
        {amount.toLocaleString(localeNum)}
        {showUnit ? ` ${unit}` : ""}
      </Text>
      {onSale && regularAmount !== undefined && regularAmount !== null ? (
        <Text size="xs" className="shop-price__was" data-testid="product.price.was">
          {regularAmount.toLocaleString(localeNum)}
        </Text>
      ) : null}
    </div>
  );
}
