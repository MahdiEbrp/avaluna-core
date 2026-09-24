"use client";

import { Button, Group, NumberInput, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import { plpHref, plpHasActiveFilters, type PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";
import { unitKey } from "../../../lib/money/price-display";
import type { MoneyProfile } from "../../../lib/money/profile";
import type { PlpFacetCategory } from "../../../lib/services/plp";

type Props = {
  locale: UiLocale;
  basePath: string;
  state: PlpQueryState;
  categories: PlpFacetCategory[];
  profile: MoneyProfile;
  priceRange: { minDisplay: number; maxDisplay: number };
  lockCategory?: boolean;
  compact?: boolean;
};

export function FilterPanel({
  locale,
  basePath,
  state,
  categories,
  profile,
  priceRange,
  lockCategory = false,
  compact = false,
}: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const currency = t(unitKey(profile));
  const active = plpHasActiveFilters(state, lockCategory);

  function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const min = String(form.get("min_price") ?? "").trim();
    const max = String(form.get("max_price") ?? "").trim();
    window.location.assign(plpHref(basePath, state, { minPrice: min, maxPrice: max }));
  }

  return (
    <Stack gap={compact ? "sm" : "md"} data-testid="plp.filters.form">
      <div>
        <Title order={3} className="shop-plp__filters-title">
          {t("shop.plp.filters")}
        </Title>
        {active ? (
          <Link
            className="shop-chip shop-chip--active"
            href={plpHref(basePath, state, {
              onSale: false,
              inStock: false,
              minPrice: "",
              maxPrice: "",
              sortKey: "newest",
              category: lockCategory ? state.category : "",
              search: "",
            })}
            data-testid="plp.filters.clear"
          >
            {t("shop.plp.clearFilters")}
          </Link>
        ) : null}
      </div>

      {!lockCategory && categories.length > 0 ? (
        <div>
          <Text size="sm" fw={600} mb={4}>
            {t("shop.plp.categoryLabel")}
          </Text>
          <div className="shop-plp__chips" data-testid="plp.filter.categories">
            <Link
              href={plpHref(basePath, state, { category: "" })}
              className={!state.category ? "shop-chip shop-chip--active" : "shop-chip"}
              data-testid="plp.chip.all"
            >
              {t("shop.nav.products")}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className={state.category === category.slug ? "shop-chip shop-chip--active" : "shop-chip"}
                data-testid={`plp.chip.${category.slug}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="shop-plp__price-form"
        action={basePath}
        method="get"
        data-testid="plp.filter.price"
        onSubmit={onSubmit}
      >
        <Group gap="xs" align="flex-end" wrap="wrap">
          <NumberInput
            name="min_price"
            label={t("shop.plp.priceMin")}
            placeholder={String(priceRange.minDisplay)}
            min={0}
            suffix={` ${currency}`}
            clampBehavior="strict"
            data-testid="plp.price.min"
            size={compact ? "sm" : "md"}
          />
          <NumberInput
            name="max_price"
            label={t("shop.plp.priceMax")}
            placeholder={String(priceRange.maxDisplay)}
            min={0}
            suffix={` ${currency}`}
            clampBehavior="strict"
            data-testid="plp.price.max"
            size={compact ? "sm" : "md"}
          />
          <Button type="submit" size={compact ? "sm" : "md"} data-testid="plp.price.apply">
            {t("shop.plp.priceApply")}
          </Button>
        </Group>
      </form>
    </Stack>
  );
}
