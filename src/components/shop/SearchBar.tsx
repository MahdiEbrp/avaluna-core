"use client";

import { Button, TextInput } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = {
  locale: UiLocale;
  id?: string;
  compact?: boolean;
};

export function SearchBar({ locale, id = "shop-search", compact }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = q.trim().slice(0, UI.SEARCH.MAX_LENGTH);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form
      role="search"
      action="/search"
      method="get"
      onSubmit={onSubmit}
      data-testid="header.search"
      className={compact ? "shop-search shop-search--compact" : "shop-search"}
    >
      <TextInput
        id={id}
        name="q"
        type="search"
        value={q}
        onChange={(event) => setQ(event.currentTarget.value)}
        placeholder={t("shop.header.searchPlaceholder")}
        aria-label={t("nav.search")}
        maxLength={UI.SEARCH.MAX_LENGTH}
        size={compact ? "sm" : "md"}
        radius="md"
        required
      />
      <Button type="submit" size={compact ? "sm" : "md"} radius="md" data-testid="header.search.submit">
        {t("shop.header.searchSubmit")}
      </Button>
    </form>
  );
}
