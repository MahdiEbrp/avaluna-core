"use client";

import { Container, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

export type LegalInfo = {
  enamad_code: string;
  samandehi_code: string;
  return_days: number;
};

type Props = { locale: UiLocale; legal: LegalInfo };

function legalValue(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  return trimmed || fallback;
}

export function ShopFooter({ locale, legal }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <footer aria-label={t("shop.a11y.footer")} data-testid="shop.footer" className="shop-footer">
      <Container size="lg" py="lg">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" gap="lg">
            <Stack gap="xs" maw="28rem">
              <Title order={2} size="h4">
                {t("nav.brand")}
              </Title>
              <Text size="sm">{t("shop.footer.tagline")}</Text>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={700}>
                {t("shop.footer.navTitle")}
              </Text>
              <Link href="/intro" data-testid="footer.intro">
                {t("shop.footer.intro")}
              </Link>
              <Link href="/products" data-testid="footer.products">
                {t("shop.nav.products")}
              </Link>
              <Link href="/cart" data-testid="footer.cart">
                {t("nav.cart")}
              </Link>
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={700}>
                {t("shop.footer.legalTitle")}
              </Text>
              <Text size="sm" data-testid="footer.enamad">
                {t("shop.footer.enamad")}: {legalValue(legal.enamad_code, t("shop.footer.notSet"))}
              </Text>
              <Text size="sm" data-testid="footer.samandehi">
                {t("shop.footer.samandehi")}: {legalValue(legal.samandehi_code, t("shop.footer.notSet"))}
              </Text>
              <Text size="sm" data-testid="footer.return-days">
                {t("shop.footer.returnDays")} ({legal.return_days})
              </Text>
            </Stack>
          </Group>
          <Text size="xs" c="dimmed" data-testid="footer.copyright">
            {t("shop.footer.copyright")}
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}
