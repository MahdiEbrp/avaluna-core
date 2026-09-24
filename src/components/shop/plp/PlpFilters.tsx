"use client";

import { Button, Drawer, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { UiLocale } from "../../../domain/ui-locale";
import type { PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import type { PlpFacetCategory } from "../../../lib/services/plp";
import { FilterPanel } from "./FilterPanel";

type Props = {
  locale: UiLocale;
  basePath: string;
  state: PlpQueryState;
  categories: PlpFacetCategory[];
  profile: MoneyProfile;
  priceRange: { minDisplay: number; maxDisplay: number };
  lockCategory?: boolean;
};

export function PlpFilters({ locale, basePath, state, categories, profile, priceRange, lockCategory }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const [opened, { open, close }] = useDisclosure(false);
  const panel = {
    locale,
    basePath,
    state,
    categories,
    profile,
    priceRange,
    lockCategory,
  } as const;

  return (
    <>
      <div className="shop-plp__filters-desk" data-testid="plp.filters">
        <FilterPanel {...panel} />
      </div>
      <div className="shop-plp__filters-mobile">
        <Button
          variant="default"
          onClick={open}
          data-testid="plp.filters.open"
          aria-label={t("shop.plp.openFilters")}
          fullWidth
        >
          {t("shop.plp.openFilters")}
        </Button>
        <Drawer
          opened={opened}
          onClose={close}
          title={t("shop.plp.filters")}
          position="right"
          size="100%"
          hiddenFrom="lg"
          keepMounted={false}
          data-testid="plp.filters.drawer"
        >
          <Stack gap="md">
            <FilterPanel {...panel} compact />
          </Stack>
        </Drawer>
      </div>
    </>
  );
}
