import { createHash } from "node:crypto";

export function cartLineKey(
  cartId: number,
  productId: number,
  variationId: number | null | undefined,
): string {
  return createHash("md5").update(`${cartId}:${productId}:${variationId ?? 0}`).digest("hex");
}
