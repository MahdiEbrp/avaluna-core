"use client";

import { DataList, DataListItem, DataListItemLabel, DataListItemValue, Stack, Tabs, Text } from "@mantine/core";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { PdpReview } from "../../../lib/services/pdp";
import { PdpReviews } from "./PdpReviews";

type Product = {
  description: string;
  sku: string | null;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  tags: { id: number; name: string }[];
};

type Props = {
  locale: UiLocale;
  productId: number;
  product: Product;
  reviews: PdpReview[];
};

export function PdpTabs({ locale, productId, product, reviews }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const dims = [product.dimensions.length, product.dimensions.width, product.dimensions.height]
    .filter(Boolean)
    .join(" × ");
  const tags = product.tags.map((tag) => tag.name).join(" · ");

  return (
    <Tabs defaultValue="description" className="shop-pdp__tabs" data-testid="pdp.tabs">
      <Tabs.List>
        <Tabs.Tab value="description" data-testid="pdp.tab.description">
          {t("shop.pdp.tabDescription")}
        </Tabs.Tab>
        <Tabs.Tab value="specs" data-testid="pdp.tab.specs">
          {t("shop.pdp.tabSpecs")}
        </Tabs.Tab>
        <Tabs.Tab value="reviews" data-testid="pdp.tab.reviews">
          {t("shop.pdp.tabReviews")}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="description" pt="md" data-testid="pdp.panel.description">
        {product.description ? (
          <Text className="shop-pdp__prose" data-testid="pdp.description">
            {product.description}
          </Text>
        ) : (
          <Text c="dimmed" data-testid="pdp.description.empty">
            {t("shop.pdp.descriptionEmpty")}
          </Text>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="specs" pt="md" data-testid="pdp.panel.specs">
        <Stack gap="xs">
          <Text fw={600}>{t("shop.pdp.specsTitle")}</Text>
          {product.sku || product.weight || dims || tags ? (
            <DataList data-testid="pdp.specs" className="shop-pdp__specs">
              {product.sku ? (
                <DataListItem key="sku">
                  <DataListItemLabel>{t("shop.pdp.sku")}</DataListItemLabel>
                  <DataListItemValue>{product.sku}</DataListItemValue>
                </DataListItem>
              ) : null}
              {product.weight ? (
                <DataListItem key="weight">
                  <DataListItemLabel>{t("shop.pdp.specWeight")}</DataListItemLabel>
                  <DataListItemValue>{product.weight}</DataListItemValue>
                </DataListItem>
              ) : null}
              {dims ? (
                <DataListItem key="dims">
                  <DataListItemLabel>{t("shop.pdp.specDimensions")}</DataListItemLabel>
                  <DataListItemValue>{dims}</DataListItemValue>
                </DataListItem>
              ) : null}
              {tags ? (
                <DataListItem key="tags">
                  <DataListItemLabel>{t("shop.pdp.specTags")}</DataListItemLabel>
                  <DataListItemValue>{tags}</DataListItemValue>
                </DataListItem>
              ) : null}
            </DataList>
          ) : (
            <Text c="dimmed" data-testid="pdp.specs.empty">
              {t("shop.pdp.specEmpty")}
            </Text>
          )}
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="reviews" pt="md">
        <PdpReviews locale={locale} productId={productId} reviews={reviews} />
      </Tabs.Panel>
    </Tabs>
  );
}
