"use client";

import { ActionIcon, Button, Card, Group, NumberInput, Stack, Table, Text } from "@mantine/core";
import { UI } from "../../../config/constants";
import type { UiLocale } from "../../../domain/ui-locale";
import type { CartLine } from "../../../lib/cart-client";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import { PriceTag } from "../PriceTag";
import { cartDisplay, cartUnitKey } from "./money";

type Props = {
  locale: UiLocale;
  lines: CartLine[];
  profile: MoneyProfile;
  pendingKey: string | null;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
};

export function CartLineList({ locale, lines, profile, pendingKey, onQuantity, onRemove }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const unit = cartUnitKey(profile);

  return (
    <div className="shop-cart__lines" data-testid="cart.lines" aria-label={t("shop.cart.a11y")}>
      <div className="shop-cart__cards" data-testid="cart.lines.cards">
        {lines.map((line) => {
          const pending = pendingKey === line.key;
          const unitDisplay = cartDisplay(line.pricing.unit_amount, profile);
          const lineDisplay = cartDisplay(line.pricing.line_amount, profile);
          return (
            <Card key={line.key} padding="md" radius="md" withBorder data-testid={`cart.line.${line.key}`}>
              <Stack gap="sm">
                <Text fw={600} data-testid="cart.line.name">
                  {line.name}
                </Text>
                <div data-testid="cart.line.unit">
                  <PriceTag locale={locale} amount={unitDisplay} unitKey={unit} size="sm" />
                </div>
                <Group justify="space-between" wrap="nowrap" align="flex-end">
                  <NumberInput
                    label={t("shop.cart.qtyLabel")}
                    value={line.quantity}
                    min={UI.CART.LINE_QTY_MIN}
                    max={UI.CART.LINE_QTY_MAX}
                    clampBehavior="strict"
                    hideControls
                    size="sm"
                    disabled={pending}
                    onChange={(value) => {
                      const next = typeof value === "number" ? value : Number(value);
                      if (Number.isFinite(next) && next >= UI.CART.LINE_QTY_MIN) {
                        onQuantity(line.key, next);
                      }
                    }}
                    data-testid="cart.line.qty"
                    aria-label={t("shop.cart.qtyLabel")}
                  />
                  <div data-testid="cart.line.total">
                    <PriceTag locale={locale} amount={lineDisplay} unitKey={unit} size="md" />
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={t("shop.cart.remove")}
                    disabled={pending}
                    onClick={() => onRemove(line.key)}
                    data-testid="cart.line.remove"
                  >
                    <Text size="sm" fw={700} aria-hidden>
                      ×
                    </Text>
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          );
        })}
      </div>

      <div className="shop-cart__table" data-testid="cart.lines.table">
        <Table highlightOnHover withTableBorder data-testid="cart.table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("shop.cart.lineName")}</Table.Th>
              <Table.Th>{t("shop.cart.lineUnit")}</Table.Th>
              <Table.Th>{t("shop.cart.qtyLabel")}</Table.Th>
              <Table.Th>{t("shop.cart.lineTotal")}</Table.Th>
              <Table.Th aria-label={t("shop.cart.remove")} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lines.map((line) => {
              const pending = pendingKey === line.key;
              const unitDisplay = cartDisplay(line.pricing.unit_amount, profile);
              const lineDisplay = cartDisplay(line.pricing.line_amount, profile);
              return (
                <Table.Tr key={line.key} data-testid={`cart.row.${line.key}`}>
                  <Table.Td data-testid="cart.line.name">{line.name}</Table.Td>
                  <Table.Td data-testid="cart.line.unit">
                    <PriceTag locale={locale} amount={unitDisplay} unitKey={unit} size="sm" />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={line.quantity}
                      min={UI.CART.LINE_QTY_MIN}
                      max={UI.CART.LINE_QTY_MAX}
                      clampBehavior="strict"
                      hideControls
                      size="sm"
                      w="5rem"
                      disabled={pending}
                      onChange={(value) => {
                        const next = typeof value === "number" ? value : Number(value);
                        if (Number.isFinite(next) && next >= UI.CART.LINE_QTY_MIN) {
                          onQuantity(line.key, next);
                        }
                      }}
                      data-testid="cart.line.qty"
                      aria-label={t("shop.cart.qtyLabel")}
                    />
                  </Table.Td>
                  <Table.Td data-testid="cart.line.total">
                    <PriceTag locale={locale} amount={lineDisplay} unitKey={unit} />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="compact-sm"
                      variant="subtle"
                      color="red"
                      disabled={pending}
                      onClick={() => onRemove(line.key)}
                      data-testid="cart.line.remove"
                    >
                      {t("shop.cart.remove")}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
