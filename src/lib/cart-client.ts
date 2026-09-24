import { API, UI } from "../config/constants";

export type CartSnapshot = {
  item_count: number;
  token: string;
  nonce: string;
};

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

export async function fetchCart(): Promise<CartSnapshot | null> {
  try {
    const response = await fetch(`${API.STOREFRONT_PREFIX}/cart`, {
      headers: cartHeaders(),
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const token = response.headers.get("X-Avaluna-Cart") ?? "";
    const nonce = response.headers.get("X-Avaluna-Nonce") ?? "";
    if (token) persistCartMeta(token, nonce);
    const body = (await response.json()) as { item_count?: number };
    return { item_count: body.item_count ?? 0, token, nonce };
  } catch {
    return null;
  }
}

async function ensureCart(): Promise<CartSnapshot | null> {
  const existing = await fetchCart();
  if (existing) return existing;
  return fetchCart();
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
    const nextToken = response.headers.get("X-Avaluna-Cart") ?? "";
    const nextNonce = response.headers.get("X-Avaluna-Nonce") ?? "";
    if (nextToken) persistCartMeta(nextToken, nextNonce);
    if (!response.ok) {
      let code = "cart.add_failed";
      try {
        const body = (await response.json()) as { code?: string };
        if (body.code) code = body.code;
      } catch {
        /* keep default */
      }
      return { ok: false, code };
    }
    const body = (await response.json()) as { item_count?: number };
    return { ok: true, item_count: body.item_count ?? 0 };
  } catch {
    return { ok: false, code: "cart.network" };
  }
}
