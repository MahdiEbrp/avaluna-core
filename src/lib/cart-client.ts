import { API, UI } from "../config/constants";

export type CartSnapshot = {
  item_count: number;
  token: string;
  nonce: string;
};

export type CartLine = {
  key: string;
  product_id: number;
  variation_id: number | null;
  quantity: number;
  name: string;
  pricing: {
    unit_amount: string | number;
    line_amount: string | number;
    currency: string;
  };
};

export type CartPromotion = {
  code: string;
  discount_amount: string | number;
};

export type CartShippingRate = {
  id: string;
  name: string;
  amount: string | number;
  selected: boolean;
};

export type CartTotals = {
  currency: string;
  items: string | number;
  discount: string | number;
  shipping: string | number;
  tax: string | number;
  grand: string | number;
};

export type CartView = {
  items: CartLine[];
  promotions: CartPromotion[];
  shipping: {
    rates: CartShippingRate[];
    carrier_quote: { amountRial: number; days: number; carrier: string } | null;
  };
  totals: CartTotals;
  requires_payment: boolean;
  requires_shipping: boolean;
  item_count: number;
};

export type CartActionResult =
  | { ok: true; view: CartView }
  | { ok: false; code: string };

function readStored(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) ?? "";
}

function writeStored(key: string, value: string) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}

export function cartHeaders(): Record<string, string> {
  const token = readStored(UI.CART_TOKEN_STORAGE);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-avaluna-cart"] = token;
  return headers;
}

export function persistCartMeta(token: string, nonce: string) {
  writeStored(UI.CART_TOKEN_STORAGE, token);
  writeStored(UI.CART_NONCE_STORAGE, nonce);
}

export function cartNonce(): string {
  return readStored(UI.CART_NONCE_STORAGE);
}

function persistFromResponse(response: Response) {
  const token = response.headers.get("X-Avaluna-Cart") ?? "";
  const nonce = response.headers.get("X-Avaluna-Nonce") ?? "";
  if (token) persistCartMeta(token, nonce);
}

async function readErrorCode(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { code?: string }; code?: string };
    return body.error?.code ?? body.code ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchCart(): Promise<CartSnapshot | null> {
  try {
    const response = await fetch(`${API.STOREFRONT_PREFIX}/cart`, {
      headers: cartHeaders(),
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    persistFromResponse(response);
    const body = (await response.json()) as { item_count?: number };
    return {
      item_count: body.item_count ?? 0,
      token: readStored(UI.CART_TOKEN_STORAGE),
      nonce: readStored(UI.CART_NONCE_STORAGE),
    };
  } catch {
    return null;
  }
}

export async function loadCartView(): Promise<CartView | null> {
  try {
    const response = await fetch(`${API.STOREFRONT_PREFIX}/cart`, {
      headers: cartHeaders(),
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    persistFromResponse(response);
    return (await response.json()) as CartView;
  } catch {
    return null;
  }
}

async function ensureCart(): Promise<CartSnapshot | null> {
  const existing = await fetchCart();
  if (existing) return existing;
  return fetchCart();
}

async function mutateCart(
  method: string,
  path: string,
  body: unknown,
  fallbackCode: string,
): Promise<CartActionResult> {
  try {
    const cart = await ensureCart();
    if (!cart || !cart.token || !cart.nonce) {
      return { ok: false, code: "cart.unavailable" };
    }
    const headers = cartHeaders();
    headers["x-avaluna-nonce"] = cart.nonce;
    const response = await fetch(`${API.STOREFRONT_PREFIX}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    persistFromResponse(response);
    if (!response.ok) {
      return { ok: false, code: await readErrorCode(response, fallbackCode) };
    }
    const view = (await response.json()) as CartView;
    return { ok: true, view };
  } catch {
    return { ok: false, code: "cart.network" };
  }
}

export async function updateCartItem(key: string, quantity: number): Promise<CartActionResult> {
  return mutateCart("PATCH", "/cart/items", { key, quantity }, "cart.update_failed");
}

export async function removeCartItem(key: string): Promise<CartActionResult> {
  return mutateCart("DELETE", "/cart/items", { key }, "cart.remove_failed");
}

export async function applyPromotion(code: string): Promise<CartActionResult> {
  return mutateCart("POST", "/cart/promotions", { code }, "promotions.invalid_code");
}

export async function removePromotion(code: string): Promise<CartActionResult> {
  return mutateCart("DELETE", "/cart/promotions", { code }, "promotions.remove_failed");
}

export type AddToCartResult =
  | { ok: true; item_count: number }
  | { ok: false; code: string };

export async function addToCart(productId: number, quantity = 1): Promise<AddToCartResult> {
  try {
    const cart = await ensureCart();
    if (!cart || !cart.token || !cart.nonce) {
      return { ok: false, code: "cart.unavailable" };
    }
    const headers = cartHeaders();
    headers["x-avaluna-nonce"] = cart.nonce;
    const response = await fetch(`${API.STOREFRONT_PREFIX}/cart/items`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    persistFromResponse(response);
    if (!response.ok) {
      return { ok: false, code: await readErrorCode(response, "cart.add_failed") };
    }
    const body = (await response.json()) as { item_count?: number };
    return { ok: true, item_count: body.item_count ?? 0 };
  } catch {
    return { ok: false, code: "cart.network" };
  }
}
