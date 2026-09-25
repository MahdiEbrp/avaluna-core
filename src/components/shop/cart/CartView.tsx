"use client";

import { Alert, Button, Center, Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import type { UiLocale } from "../../../domain/ui-locale";
import {
  applyPromotion,
  loadCartView,
  removeCartItem,
  removePromotion,
  updateCartItem,
  type CartView as CartViewData,
} from "../../../lib/cart-client";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { MoneyProfile } from "../../../lib/money/profile";
import type { ShopChrome } from "../../../lib/services/shop-chrome";
import { ShopShell } from "../ShopShell";
import { useCart } from "../CartProvider";
import { CartEmpty } from "./CartEmpty";
import { CartLineList } from "./CartLineList";
import { CartSummary } from "./CartSummary";
import { CouponForm } from "./CouponForm";

type Props = {
  locale: UiLocale;
  chrome: ShopChrome;
  profile: MoneyProfile;
};

function couponMessage(locale: UiLocale, code: string): string {
  if (code === "promotions.invalid_code") return uiCopy(locale, "shop.cart.couponInvalid");
  return uiCopy(locale, "shop.cart.couponFailed");
}

export function CartView({ locale, chrome, profile }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const { refresh } = useCart();
  const [view, setView] = useState<CartViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await loadCartView();
      if (cancelled) return;
      setView(next);
      setLoadFailed(next === null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retryLoad() {
    setLoading(true);
    setLoadFailed(false);
    setReloadKey((key) => key + 1);
  }

  async function applyResult(result: Awaited<ReturnType<typeof updateCartItem>>, failKey: string) {
    if (result.ok) {
      setView(result.view);
      setError(null);
      await refresh();
    } else {
      setError(uiCopy(locale, failKey));
    }
  }

  async function handleQuantity(key: string, quantity: number) {
    setPendingKey(key);
    setError(null);
    try {
      const result = await updateCartItem(key, quantity);
      await applyResult(result, "shop.cart.updateFailed");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleRemove(key: string) {
    setPendingKey(key);
    setError(null);
    try {
      const result = await removeCartItem(key);
      await applyResult(result, "shop.cart.updateFailed");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleApply(code: string) {
    setBusy(true);
    setCouponMsg(null);
    try {
      const result = await applyPromotion(code);
      if (result.ok) {
        setView(result.view);
        setCouponMsg(uiCopy(locale, "shop.cart.couponApplied"));
      } else {
        setCouponMsg(couponMessage(locale, result.code));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemovePromotion(code: string) {
    setBusy(true);
    setCouponMsg(null);
    try {
      const result = await removePromotion(code);
      if (result.ok) setView(result.view);
      else setCouponMsg(uiCopy(locale, "shop.cart.couponFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ShopShell locale={locale} categories={chrome.categories} legal={chrome.legal}>
      <div className="shop-cart" data-testid="cart.view">
        <header className="shop-cart__head">
          <Title order={1} data-testid="cart.title">
            {t("shop.cart.title")}
          </Title>
        </header>

        {loading ? (
          <Center className="shop-cart__loading" mih="30vh" data-testid="cart.loading" aria-busy="true">
            <Stack align="center" gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                {t("shop.cart.loading")}
              </Text>
            </Stack>
          </Center>
        ) : loadFailed ? (
          <Alert color="red" title={t("shop.cart.loadError")} data-testid="cart.load.error" className="shop-cart__load-error">
            <Button
              variant="light"
              size="sm"
              mt="sm"
              onClick={retryLoad}
              data-testid="cart.load.retry"
            >
              {t("shop.cart.retry")}
            </Button>
          </Alert>
        ) : !view || view.items.length === 0 ? (
          <CartEmpty locale={locale} />
        ) : (
          <div className="shop-cart__layout">
            <div className="shop-cart__main">
              {error ? (
                <Text size="sm" c="red" data-testid="cart.error">
                  {error}
                </Text>
              ) : null}
              <CartLineList
                locale={locale}
                lines={view.items}
                profile={profile}
                pendingKey={pendingKey}
                onQuantity={(key, quantity) => void handleQuantity(key, quantity)}
                onRemove={(key) => void handleRemove(key)}
              />
              <CouponForm
                locale={locale}
                codes={view.promotions.map((p) => p.code)}
                pending={busy}
                message={couponMsg}
                onApply={(code) => void handleApply(code)}
                onRemove={(code) => void handleRemovePromotion(code)}
              />
            </div>
            <aside className="shop-cart__aside">
              <CartSummary locale={locale} view={view} profile={profile} />
            </aside>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
