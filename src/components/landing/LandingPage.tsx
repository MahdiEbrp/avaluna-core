"use client";

import {
  AppShell,
  Burger,
  Button,
  CloseButton,
  Container,
  Group,
  Menu,
  Modal,
  NavLink,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { API, UI } from "../../config/constants";
import { localeSwitchHref, type UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { LandingHero } from "./LandingHero";
import { LandingSections } from "./LandingSections";

type Props = { locale: UiLocale };

export function LandingPage({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const router = useRouter();
  const [navOpen, nav] = useDisclosure(false);
  const [apiOpen, api] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: UI.HEADER_HEIGHT }}
      navbar={{ width: UI.NAVBAR_WIDTH, breakpoint: "sm", collapsed: { mobile: !navOpen, desktop: true } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={navOpen} onClick={nav.toggle} hiddenFrom="sm" size="sm" aria-label={t("nav.features")} />
            <Text fw="bold">{t("nav.brand")}</Text>
          </Group>
          <Group visibleFrom="sm" gap="xs">
            <NavLink component="a" href="#features" label={t("nav.features")} w="auto" />
            <NavLink component="a" href="#flow" label={t("nav.flow")} w="auto" />
            <NavLink component="a" href="#api" label={t("nav.api")} w="auto" />
            <NavLink component="a" href="#faq" label={t("nav.faq")} w="auto" />
          </Group>
          <Group>
            <Tooltip label={t("nav.locale")}>
              <SegmentedControl
                size="xs"
                value={locale}
                onChange={(value) => router.push(localeSwitchHref(value as UiLocale, "/intro"))}
                data={[
                  { value: "fa", label: uiCopy(locale, "locale.fa") },
                  { value: "en", label: uiCopy(locale, "locale.en") },
                ]}
              />
            </Tooltip>
            <Menu>
              <Menu.Target>
                <Button variant="default" size="xs">
                  {t("nav.api")}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={api.open}>{t("api.modal")}</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavLink component="a" href="#features" label={t("nav.features")} onClick={nav.close} />
        <NavLink component="a" href="#flow" label={t("nav.flow")} onClick={nav.close} />
        <NavLink component="a" href="#api" label={t("nav.api")} onClick={nav.close} />
        <NavLink component="a" href="#faq" label={t("nav.faq")} onClick={nav.close} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="md">
          <Stack gap="xl" className="landing-page">
            <LandingHero locale={locale} onOpenApi={api.open} />
            <LandingSections locale={locale} />
          </Stack>
        </Container>
      </AppShell.Main>
      <Modal opened={apiOpen} onClose={api.close} title={t("api.modal")}>
        <Stack>
          <Text>{API.STOREFRONT_PREFIX}</Text>
          <Text>{API.SERVICES_PREFIX}</Text>
          <Text size="sm" c="dimmed">
            {t("tabs.shop.body")}
          </Text>
          <Group justify="flex-end">
            <CloseButton aria-label={t("api.close")} onClick={api.close} />
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
