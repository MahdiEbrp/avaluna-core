"use client";

import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { UI } from "../config/constants";
import { mantineTheme } from "../lib/mantine-theme";
import { CartProvider } from "./shop/CartProvider";

type Props = {
  nonce: string;
  children: ReactNode;
};

export function AppProviders({ nonce, children }: Props) {
  return (
    <MantineProvider
      theme={mantineTheme}
      defaultColorScheme={UI.MANTINE_SCHEME}
      forceColorScheme={UI.MANTINE_SCHEME}
      getStyleNonce={() => nonce}
    >
      <Notifications />
      <CartProvider>{children}</CartProvider>
    </MantineProvider>
  );
}
