"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UI } from "../../config/constants";
import { fetchCart } from "../../lib/cart-client";

type CartState = {
  count: number;
  ready: boolean;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartState>({ count: 0, ready: false, refresh: async () => {} });

export function useCart(): CartState {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const snapshot = await fetchCart();
    if (snapshot) {
      const max = UI.CART.BADGE_MAX;
      setCount(snapshot.item_count > max ? max : snapshot.item_count);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const snapshot = await fetchCart();
      if (cancelled) return;
      if (snapshot) {
        const max = UI.CART.BADGE_MAX;
        setCount(snapshot.item_count > max ? max : snapshot.item_count);
      }
      setReady(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ count, ready, refresh }), [count, ready, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
