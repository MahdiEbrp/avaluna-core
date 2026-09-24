"use client";

import { Badge, Button, Group, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = { locale: UiLocale };

export function HomeHero({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <section className="shop-hero" data-testid="home.hero" aria-labelledby="home.hero-title">
      <div className="shop-hero__copy">
        <Badge variant="light" color="brand" className="shop-hero__kicker">
          {t("shop.home.heroKicker")}
        </Badge>
        <Title order={1} id="home.hero-title" className="shop-hero__title">
          {t("shop.home.title")}
        </Title>
        <Text className="shop-hero__lede">{t("shop.home.lede")}</Text>
        <Group gap="sm" className="shop-hero__actions">
          <Button component={Link} href="/products" size="md" data-testid="home.hero.cta">
            {t("shop.home.heroCta")}
          </Button>
        </Group>
      </div>
      <div className="shop-hero__panel" data-testid="home.hero.panel" aria-hidden />
    </section>
  );
}
