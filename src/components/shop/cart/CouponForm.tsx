"use client";

import { Button, Group, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { UI } from "../../../config/constants";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  codes: string[];
  pending: boolean;
  message: string | null;
  onApply: (code: string) => void;
  onRemove: (code: string) => void;
};

export function CouponForm({ locale, codes, pending, message, onApply, onRemove }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const [value, setValue] = useState("");

  return (
    <div className="shop-cart__coupon" data-testid="cart.coupon">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const code = value.trim();
          if (!code) return;
          onApply(code);
          setValue("");
        }}
      >
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <TextInput
            className="shop-cart__coupon-input"
            label={t("shop.cart.couponLabel")}
            placeholder={t("shop.cart.couponPlaceholder")}
            value={value}
            maxLength={UI.CART.COUPON_MAX_LENGTH}
            onChange={(event) => setValue(event.currentTarget.value)}
            data-testid="cart.coupon.input"
          />
          <Button type="submit" loading={pending} data-testid="cart.coupon.apply">
            {t("shop.cart.couponApply")}
          </Button>
        </Group>
      </form>
      {codes.length > 0 ? (
        <Group gap="xs" mt="sm" data-testid="cart.coupon.applied">
          {codes.map((code) => (
            <Group key={code} gap={4} wrap="nowrap">
              <Text size="sm" fw={600} data-testid="cart.coupon.code">
                {code}
              </Text>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                disabled={pending}
                onClick={() => onRemove(code)}
                data-testid="cart.coupon.remove"
              >
                {t("shop.cart.couponRemove")}
              </Button>
            </Group>
          ))}
        </Group>
      ) : null}
      {message ? (
        <Text size="sm" mt="xs" data-testid="cart.coupon.message">
          {message}
        </Text>
      ) : null}
    </div>
  );
}
