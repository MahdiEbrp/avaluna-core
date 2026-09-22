import { and, eq } from "drizzle-orm";
import { CART, LOW_STOCK_THRESHOLD } from "../../config/constants";
import { applyMovement, isLowStock } from "../../domain/inventory-ledger";
import { canReserve, reservationExpiresAt } from "../../domain/reservation";
import { db, withWriteTransaction } from "../db/client";
import { inventoryLevels, inventoryMovements, inventoryReservations, locations, products } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";

export async function createLocation(input: { name: string; code: string; country?: string; is_default?: boolean }) {
  const row = await db
    .insert(locations)
    .values({
      name: input.name,
      code: input.code.toUpperCase(),
      country: input.country ?? "",
      isDefault: input.is_default ?? false,
    })
    .returning();
  return row[0];
}

export async function listLocations() {
  return db.select().from(locations);
}

export async function adjustInventory(input: {
  location_id: number;
  product_id: number;
  variation_id?: number | null;
  delta: number;
  reason: string;
}) {
  return withWriteTransaction(async () => {
    const existing = (
      await db
        .select()
        .from(inventoryLevels)
        .where(and(eq(inventoryLevels.locationId, input.location_id), eq(inventoryLevels.productId, input.product_id)))
        .limit(1)
    )[0];
    const nextQty = applyMovement(existing?.quantity ?? 0, input.delta);
    if (existing) {
      await db.update(inventoryLevels).set({ quantity: nextQty }).where(eq(inventoryLevels.id, existing.id));
    } else {
      await db.insert(inventoryLevels).values({
        locationId: input.location_id,
        productId: input.product_id,
        variationId: input.variation_id ?? null,
        quantity: nextQty,
      });
    }
    await db.insert(inventoryMovements).values({
      locationId: input.location_id,
      productId: input.product_id,
      variationId: input.variation_id ?? null,
      delta: input.delta,
      reason: input.reason,
      createdAt: nowIso(),
    });
    return { quantity: nextQty, low_stock: isLowStock(nextQty, LOW_STOCK_THRESHOLD) };
  });
}

export async function listInventory() {
  const rows = await db.select().from(inventoryLevels);
  return rows.map((row) => ({
    ...row,
    low_stock: isLowStock(row.quantity, LOW_STOCK_THRESHOLD),
  }));
}

export async function reserveInventory(input: {
  product_id: number;
  quantity: number;
  variation_id?: number | null;
  cart_id?: number;
}) {
  return withWriteTransaction(async () => {
    const product = (await db.select().from(products).where(eq(products.id, input.product_id)).limit(1))[0];
    if (!product) {
      throw new ApiError(404, "catalog.product_not_found", "Product not found.");
    }
    const holds = await db.select().from(inventoryReservations).where(eq(inventoryReservations.productId, input.product_id));
    const now = Date.now();
    const reserved = holds
      .filter((row) => !row.released && row.expiresAtMs > now)
      .reduce((sum, row) => sum + row.quantity, 0);
    if (!canReserve(product.stockQuantity, reserved, input.quantity)) {
      throw new ApiError(409, "inventory.reservation_failed", "Not enough available inventory to reserve.");
    }
    const created = await db
      .insert(inventoryReservations)
      .values({
        productId: input.product_id,
        variationId: input.variation_id ?? null,
        quantity: input.quantity,
        expiresAtMs: reservationExpiresAt(now, CART.RESERVATION_TTL_MS),
        cartId: input.cart_id ?? null,
        createdAt: nowIso(),
      })
      .returning();
    return requireInserted(created[0], "reservation");
  });
}
