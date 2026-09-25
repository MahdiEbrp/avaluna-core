"use client";

import { AspectRatio, Badge, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import { displayPrice, unitKey } from "../../../lib/money/price-display";
import { pdpImagePath } from "../../../domain/pdp";
import { AddToCartButton } from "../AddToCartButton";
import { PriceTag } from "../PriceTag";
import { RatingStars } from "../RatingStars";

type Image = { id: number; src: string; alt: string; position: number };

type Props = {
  locale: UiLocale;
  productId: number;
  name: string;
  summary: string;
  images: Image[];
  onSale: boolean;
  regularMinor: number;
  saleMinor: number | null;
  stockStatus: string;
  stockQty: number;
  ratingAverage: number;
  ratingCount: number;
  sku: string | null;
  profile: MoneyProfile;
  codEnabled: boolean;
};

export function PdpBuyBox({
  locale,
  productId,
  name,
  summary,
  images,
  onSale,
  regularMinor,
  saleMinor,
  stockStatus,
  stockQty,
  ratingAverage,
  ratingCount,
  sku,
  profile,
  codEnabled,
}: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const out = stockStatus === "out_of_stock";
  const current = displayPrice(saleMinor ?? regularMinor, profile);
  const regular = onSale ? displayPrice(regularMinor, profile) : null;
  const primary = images[0];
  const alt = primary?.alt || name || t("shop.pdp.imageAlt");

  return (
    <Stack className="shop-pdp__buy" gap="md" data-testid="pdp.buy">
      <div className="shop-pdp__gallery" data-testid="pdp.gallery" aria-label={t("shop.pdp.gallery")}>
        {primary ? (
          <AspectRatio ratio={1} className="shop-pdp__main-image">
            {/* eslint-disable-next-line @next/next/no-img-element -- local SVG catalog assets */}
            <img src={pdpImagePath(primary.src)} alt={alt} className="shop-card__img" data-testid="pdp.image" />
          </AspectRatio>
        ) : (
          <AspectRatio ratio={1} className="shop-pdp__main-image">
            <div className="shop-card__placeholder" data-testid="pdp.image.placeholder" aria-hidden />
          </AspectRatio>
        )}
        {images.length > 1 ? (
          <div className="shop-pdp__thumbs" role="list">
            {images.map((image) => (
              <div key={image.id} role="listitem" className="shop-pdp__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element -- local SVG catalog assets */}
                <img src={pdpImagePath(image.src)} alt={image.alt || alt} loading="lazy" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="shop-pdp__meta">
        <Group gap="xs" wrap="wrap">
          {onSale ? (
            <Badge color="sale" variant="light" data-testid="product.badge.sale">
              {t("shop.home.saleBadge")}
            </Badge>
          ) : null}
          <ThemeIcon size="sm" variant="light" color={out ? "danger" : "success"} aria-hidden>
            <Text size="xs" fw={700}>
              {out ? "!" : "✓"}
            </Text>
          </ThemeIcon>
          <Text size="sm" c="dimmed" data-testid="pdp.stock">
            {out ? t("shop.home.stockOut") : `${t("shop.home.stockIn")} · ${stockQty}`}
          </Text>
        </Group>
        <PriceTag locale={locale} amount={current} regularAmount={regular} unitKey={unitKey(profile)} size="lg" />
        <RatingStars locale={locale} average={ratingAverage} count={ratingCount} />
        {summary ? (
          <Text size="sm" c="dimmed" data-testid="pdp.summary">
            {summary}
          </Text>
        ) : null}
        {sku ? (
          <Text size="xs" c="dimmed" data-testid="pdp.sku">
            {t("shop.pdp.sku")}: {sku}
          </Text>
        ) : null}
        {codEnabled && !out ? (
          <Text size="xs" className="shop-pdp__cod" data-testid="pdp.cod">
            {t("shop.pdp.codNote")}
          </Text>
        ) : null}
        <AddToCartButton locale={locale} productId={productId} outOfStock={out} testId="pdp.add" />
      </div>
    </Stack>
  );
}
