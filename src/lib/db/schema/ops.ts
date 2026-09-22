import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  topic: text("topic").notNull(),
  deliveryUrl: text("delivery_url").notNull(),
  secret: text("secret").notNull(),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: integer("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  requestBody: text("request_body").notNull(),
  responseCode: integer("response_code"),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  group: text("group").notNull(),
  id: text("id").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull().default("text"),
  value: text("value").notNull(),
});

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  country: text("country").notNull().default(""),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const inventoryLevels = sqliteTable("inventory_levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationId: integer("location_id").notNull(),
  productId: integer("product_id").notNull(),
  variationId: integer("variation_id"),
  quantity: integer("quantity").notNull().default(0),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationId: integer("location_id").notNull(),
  productId: integer("product_id").notNull(),
  variationId: integer("variation_id"),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
});

export const productRelations = sqliteTable("product_relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  relatedProductId: integer("related_product_id").notNull(),
  relationType: text("relation_type").notNull(),
});

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
});

export const collectionProducts = sqliteTable("collection_products", {
  collectionId: integer("collection_id").notNull(),
  productId: integer("product_id").notNull(),
  position: integer("position").notNull().default(0),
});

export const wishlists = sqliteTable("wishlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  name: text("name").notNull().default("Default"),
  createdAt: text("created_at").notNull(),
});

export const wishlistItems = sqliteTable("wishlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wishlistId: integer("wishlist_id").notNull(),
  productId: integer("product_id").notNull(),
});

export const giftCards = sqliteTable("gift_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  balanceCents: integer("balance_cents").notNull(),
  disabled: integer("disabled", { mode: "boolean" }).notNull().default(false),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
});

export const customerGroups = sqliteTable("customer_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  discountPercent: integer("discount_percent").notNull().default(0),
});

export const customerGroupMembers = sqliteTable("customer_group_members", {
  groupId: integer("group_id").notNull(),
  customerId: integer("customer_id").notNull(),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  kind: text("kind").notNull().default("shipping"),
  line1: text("line1").notNull(),
  city: text("city").notNull().default(""),
  postcode: text("postcode").notNull().default(""),
  country: text("country").notNull().default(""),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const currencies = sqliteTable("currencies", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  rate: real("rate").notNull(),
});

export const fulfillments = sqliteTable("fulfillments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  status: text("status").notNull().default("pending"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const fulfillmentItems = sqliteTable("fulfillment_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fulfillmentId: integer("fulfillment_id").notNull(),
  orderItemId: integer("order_item_id").notNull(),
  quantity: integer("quantity").notNull(),
});

export const returnRequests = sqliteTable("return_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  status: text("status").notNull().default("requested"),
  reason: text("reason").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const returnItems = sqliteTable("return_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  returnId: integer("return_id").notNull(),
  orderItemId: integer("order_item_id").notNull(),
  quantity: integer("quantity").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channel: text("channel").notNull().default("email"),
  template: text("template").notNull(),
  recipient: text("recipient").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at").notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const loyaltyAccounts = sqliteTable("loyalty_accounts", {
  customerId: integer("customer_id").primaryKey(),
  points: integer("points").notNull().default(0),
});

export const idempotencyKeys = sqliteTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    fingerprint: text("fingerprint").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
);

export const inventoryReservations = sqliteTable("inventory_reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  variationId: integer("variation_id"),
  quantity: integer("quantity").notNull(),
  expiresAtMs: integer("expires_at_ms").notNull(),
  released: integer("released", { mode: "boolean" }).notNull().default(false),
  cartId: integer("cart_id"),
  createdAt: text("created_at").notNull(),
});

export const paymentIntents = sqliteTable("payment_intents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("IRR"),
  method: text("method").notNull(),
  status: text("status").notNull().default("requires_action"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
