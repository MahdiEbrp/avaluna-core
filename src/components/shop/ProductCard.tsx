"use client";

import { AspectRatio, Badge, Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../lib/money/profile";
import { cardPriceMinor, displayPrice, unitKey } from "../../lib/money/price-display";
import type { HomeCard } from "../../lib/services/home";
import { AddToCartButton } from "./AddToCartButton";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";

type Props = {
  locale: UiLocale;
  product: HomeCard;
  profile: MoneyProfile;
  testId?: string;
};

export function ProductCard({ locale, product, profile, testId = "product.card" }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const name = product.name;
  const href = `/products/${product.slug}`;
  const current = displayPrice(cardPriceMinor(product), profile);
  const regular = product.onSale ? displayPrice(product.regularMinor, profile) : null;
  const out = product.stockStatus === "outofstock";
  const alt = product.imageAlt || `${t("shop.home.imageAlt")} ${name}`;

  return (
    <Card padding="sm" withBorder radius="md" className="shop-card" data-testid={testId}>
      <Card.Section>
        <Link href={href} className="shop-card__media" aria-label={name}>
          {product.imageSrc ? (
            <AspectRatio ratio={1}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local SVG catalog assets */}
              <img src={product.imageSrc} alt={alt} className="shop-card__img" loading="lazy" />
            </AspectRatio>
          ) : (
            <AspectRatio ratio={1}>
              <div className="shop-card__placeholder" data-testid="product.card.placeholder" aria-hidden />
            </AspectRatio>
          )}
        </Link>
      </Card.Section>
      <Stack gap="xs" mt="sm">
        <Group justify="space-between" gap="xs" wrap="wrap">
          {product.onSale ? (
            <Badge color="sale" variant="light" data-testid="product.badge.sale">
              {t("shop.home.saleBadge")}
            </Badge>
          ) : (
            <span />
          )}
          <ThemeIcon size="sm" variant="light" color={out ? "danger" : "success"} aria-hidden>
            <Text size="xs" fw={700}>
              {out ? "!" : "✓"}
            </Text>
          </ThemeIcon>
        </Group>
        <Text
          component="a"
          href={href}
          className="shop-card__title"
          lineClamp={2}
          data-testid="product.card.title"
        >
          {name}
        </Text>
        <Text size="xs" c="dimmed" data-testid="product.card.stock">
          {out ? t("shop.home.stockOut") : t("shop.home.stockIn")}
        </Text>
        <PriceTag locale={locale} amount={current} regularAmount={regular} unitKey={unitKey(profile)} />
        <RatingStars locale={locale} average={product.ratingAverage} count={product.ratingCount} compact />
        <AddToCartButton locale={locale} productId={product.id} outOfStock={out} compact />
      </Stack>
    </Card>
  );
}
