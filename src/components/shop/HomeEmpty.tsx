"use client";

import { Button, Center, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = { locale: UiLocale };

export function HomeEmpty({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Center className="shop-home-empty" mih="40vh">
      <Stack align="center" gap="md" ta="center">
        <Title order={2} className="shop-home-empty__title">
          {t("shop.home.emptyTitle")}
        </Title>
        <Text maw="28rem">{t("shop.home.emptyBody")}</Text>
        <Button component={Link} href="/intro" variant="default" data-testid="home.empty.cta">
          {t("shop.footer.intro")}
        </Button>
      </Stack>
    </Center>
  );
}
