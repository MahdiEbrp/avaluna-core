import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const coupons = sqliteTable(
  "coupons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    discountType: text("discount_type").notNull().default("percent"),
    amountCentsOrPercent: integer("amount").notNull(),
    individualUse: integer("individual_use", { mode: "boolean" })
      .notNull()
      .default(false),
    usageLimit: integer("usage_limit"),
    usageLimitPerUser: integer("usage_limit_per_user"),
    usageCount: integer("usage_count").notNull().default(0),
    freeShipping: integer("free_shipping", { mode: "boolean" })
      .notNull()
      .default(false),
    excludeSaleItems: integer("exclude_sale_items", { mode: "boolean" })
      .notNull()
      .default(false),
    minimumAmountCents: integer("minimum_amount_cents"),
    maximumAmountCents: integer("maximum_amount_cents"),
    productIdsJson: text("product_ids_json").notNull().default("[]"),
    excludedProductIdsJson: text("excluded_product_ids_json")
      .notNull()
      .default("[]"),
    emailRestrictionsJson: text("email_restrictions_json")
      .notNull()
      .default("[]"),
    expiryDate: text("expiry_date"),
    description: text("description").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull(),
    status: text("status").notNull().default("pending"),
    currency: text("currency").notNull().default("IRR"),
    customerId: integer("customer_id"),
    customerEmail: text("customer_email").notNull(),
    billingJson: text("billing_json").notNull().default("{}"),
    shippingJson: text("shipping_json").notNull().default("{}"),
    paymentMethod: text("payment_method").notNull().default(""),
    paymentMethodTitle: text("payment_method_title").notNull().default(""),
    transactionId: text("transaction_id"),
    customerNote: text("customer_note").notNull().default(""),
    cartHash: text("cart_hash"),
    discountTotalCents: integer("discount_total_cents").notNull().default(0),
    shippingTotalCents: integer("shipping_total_cents").notNull().default(0),
    taxTotalCents: integer("tax_total_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    pricesIncludeTax: integer("prices_include_tax", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    datePaid: text("date_paid"),
    dateCompleted: text("date_completed"),
    stockTaken: integer("stock_taken", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.number),
    index("orders_status_idx").on(t.status),
    index("orders_customer_idx").on(t.customerId),
    index("orders_email_idx").on(t.customerEmail),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id"),
    variationId: integer("variation_id"),
    name: text("name").notNull(),
    sku: text("sku"),
    quantity: integer("quantity").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    taxCents: integer("tax_cents").notNull().default(0),
    metaJson: text("meta_json").notNull().default("{}"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderNotes = sqliteTable("order_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  customerNote: integer("customer_note", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull(),
});

export const refunds = sqliteTable("refunds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  reason: text("reason").notNull().default(""),
  restock: integer("restock", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const carts = sqliteTable(
  "carts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    token: text("token").notNull(),
    nonce: text("nonce").notNull(),
    customerId: integer("customer_id"),
    email: text("email"),
    billingJson: text("billing_json").notNull().default("{}"),
    shippingJson: text("shipping_json").notNull().default("{}"),
    couponsJson: text("coupons_json").notNull().default("[]"),
    selectedShipping: text("selected_shipping"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (t) => [uniqueIndex("carts_token_uq").on(t.token), index("carts_nonce_idx").on(t.nonce)],
);

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: integer("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    productId: integer("product_id").notNull(),
    variationId: integer("variation_id"),
    quantity: integer("quantity").notNull(),
  },
  (t) => [uniqueIndex("cart_items_key_uq").on(t.key), index("cart_items_cart_idx").on(t.cartId)],
);

export const shippingZones = sqliteTable("shipping_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
});

export const shippingZoneLocations = sqliteTable("shipping_zone_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => shippingZones.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  type: text("type").notNull(),
});

export const shippingMethods = sqliteTable("shipping_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => shippingZones.id, { onDelete: "cascade" }),
  methodId: text("method_id").notNull(),
  title: text("title").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  costCents: integer("cost_cents").notNull().default(0),
  minAmountCents: integer("min_amount_cents"),
});

export const taxRates = sqliteTable("tax_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  country: text("country").notNull().default(""),
  state: text("state").notNull().default(""),
  postcode: text("postcode").notNull().default(""),
  city: text("city").notNull().default(""),
  rate: real("rate").notNull(),
  name: text("name").notNull(),
  taxClass: text("tax_class").notNull().default("standard"),
  shipping: integer("shipping", { mode: "boolean" }).notNull().default(true),
  compound: integer("compound", { mode: "boolean" }).notNull().default(false),
  priority: integer("priority").notNull().default(1),
});

export const paymentGateways = sqliteTable("payment_gateways", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  methodTitle: text("method_title").notNull(),
  settingsJson: text("settings_json").notNull().default("{}"),
});
