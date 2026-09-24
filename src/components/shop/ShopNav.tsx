"use client";

import { Burger, Drawer, Group, NavLink, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { SearchBar } from "./SearchBar";

export type NavCategory = { id: number; name: string; slug: string };

type Props = {
  locale: UiLocale;
  categories: NavCategory[];
};

function CategoryLinks({
  locale,
  categories,
  onNavigate,
}: {
  locale: UiLocale;
  categories: NavCategory[];
  onNavigate?: () => void;
}) {
  const t = (key: string) => uiCopy(locale, key);
  const pathname = usePathname();
  return (
    <Stack gap={0}>
      <NavLink
        component={Link}
        href="/"
        label={t("shop.nav.home")}
        active={pathname === "/"}
        onClick={onNavigate}
        data-testid="nav.home"
      />
      <NavLink
        component={Link}
        href="/products"
        label={t("shop.nav.products")}
        active={pathname?.startsWith("/products") ?? false}
        onClick={onNavigate}
        data-testid="nav.products"
      />
      {categories.map((category) => (
        <NavLink
          key={category.id}
          component={Link}
          href={`/categories/${category.slug}`}
          label={category.name}
          onClick={onNavigate}
          data-testid={`nav.cat.${category.slug}`}
        />
      ))}
    </Stack>
  );
}

export function ShopNav({ locale, categories }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("shop.a11y.nav")}
      data-testid="desk.nav"
      className="shop-desk-nav shop-desk-nav--responsive"
    >
      <Group gap="md" wrap="nowrap" px="md" py="xs" className="shop-nav-scroll">
        <NavLink
          component={Link}
          href="/"
          label={t("shop.nav.home")}
          active={pathname === "/"}
          w="auto"
          data-testid="nav.home"
        />
        <NavLink
          component={Link}
          href="/products"
          label={t("shop.nav.products")}
          active={pathname?.startsWith("/products") ?? false}
          w="auto"
          data-testid="nav.products"
        />
        {categories.map((category) => (
          <NavLink
            key={category.id}
            component={Link}
            href={`/categories/${category.slug}`}
            label={category.name}
            w="auto"
            data-testid={`nav.cat.${category.slug}`}
          />
        ))}
      </Group>
    </nav>
  );
}

export function MobileMenu({ locale, categories }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Burger
        opened={opened}
        onClick={opened ? close : open}
        hiddenFrom={UI.BURGER_BREAKPOINT}
        size="sm"
        aria-label={opened ? t("shop.header.closeMenu") : t("shop.header.menu")}
        data-testid="header.burger"
      />
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Title order={4} size="h5">
            {t("shop.header.menu")}
          </Title>
        }
        padding="md"
        position="left"
        data-testid="nav.drawer"
      >
        <ScrollArea.Autosize mah="70vh">
          <Stack gap="md">
            <SearchBar locale={locale} id="drawer-search" compact />
            <div>
              <Text size="xs" c="dimmed" mb={4}>
                {t("shop.header.categories")}
              </Text>
              <CategoryLinks locale={locale} categories={categories} onNavigate={close} />
            </div>
          </Stack>
        </ScrollArea.Autosize>
      </Drawer>
    </>
  );
}
