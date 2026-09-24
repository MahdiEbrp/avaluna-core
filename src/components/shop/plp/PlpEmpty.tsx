"use client";

import { Center, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../../domain/ui-locale";
import { plpHref, type PlpQueryState } from "../../../domain/plp";
import { uiCopy } from "../../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  basePath: string;
  state: PlpQueryState;
  lockCategory?: boolean;
};

export function PlpEmpty({ locale, basePath, state, lockCategory = false }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Center className="shop-plp__empty" mih="30vh" data-testid="plp.empty">
      <Stack align="center" gap="md" ta="center">
        <Title order={2} className="shop-plp__empty-title">
          {t("shop.plp.emptyTitle")}
        </Title>
        <Text maw="28rem">{t("shop.plp.emptyBody")}</Text>
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
          data-testid="plp.empty.clear"
        >
          {t("shop.plp.clearFilters")}
        </Link>
      </Stack>
    </Center>
  );
}
