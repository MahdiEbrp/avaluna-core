"use client";

import { Group, Text } from "@mantine/core";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  average: number;
  count: number;
  compact?: boolean;
};

const STAR_FULL = "★";
const STAR_EMPTY = "☆";

function stars(average: number): string {
  const rounded = Math.round(Math.min(5, Math.max(0, average)));
  return `${STAR_FULL.repeat(rounded)}${STAR_EMPTY.repeat(5 - rounded)}`;
}

export function RatingStars({ locale, average, count, compact = false }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  if (count <= 0) return null;
  const label = `${t("shop.home.ratingLabel")} ${average} / 5 (${count})`;
  return (
    <Group gap={4} wrap="nowrap" data-testid="product.rating" aria-label={label}>
      <Text size={compact ? "xs" : "sm"} className="shop-rating__stars" aria-hidden>
        {stars(average)}
      </Text>
      <Text size="xs" c="dimmed" data-testid="product.rating.value">
        {average} ({count})
      </Text>
    </Group>
  );
}
