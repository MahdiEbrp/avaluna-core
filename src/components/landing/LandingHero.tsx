"use client";

import { Alert, Badge, Blockquote, Button, Group, Highlight, Stack, Text, Title } from "@mantine/core";
import { API } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = { locale: UiLocale; onOpenApi: () => void };

export function LandingHero({ locale, onOpenApi }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Stack id="hero" gap="lg">
      <Badge variant="light">{t("hero.kicker")}</Badge>
      <Title order={1}>{t("hero.title")}</Title>
      <Highlight highlight={t("hero.highlight")}>{t("hero.lede")}</Highlight>
      <Group>
        <Button component="a" href="#flow">
          {t("hero.cta")}
        </Button>
        <Button variant="default" onClick={onOpenApi}>
          {t("hero.secondary")}
        </Button>
      </Group>
      <Group gap="xs">
        <Badge variant="outline">{t("chip.rial")}</Badge>
        <Badge variant="outline">{t("chip.jalali")}</Badge>
        <Badge variant="outline">{t("chip.rtl")}</Badge>
        <Badge variant="outline">{t("chip.zarinpal")}</Badge>
        <Badge variant="outline">{t("chip.otp")}</Badge>
      </Group>
      <Alert>{t("alert.vat")}</Alert>
      <Blockquote cite={t("hero.quoteCite")}>{t("hero.quote")}</Blockquote>
      <Text c="dimmed" size="sm">
        <Text span inherit>
          {API.STOREFRONT_PREFIX}
        </Text>
      </Text>
    </Stack>
  );
}
