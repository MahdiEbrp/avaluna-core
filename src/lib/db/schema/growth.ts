import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  status: text("status").notNull().default("active"),
  intervalDays: integer("interval_days").notNull().default(30),
  amountCents: integer("amount_cents").notNull(),
  attempt: integer("attempt").notNull().default(0),
  nextBillingAtMs: integer("next_billing_at_ms").notNull(),
  createdAt: text("created_at").notNull(),
});

export const draftOrders = sqliteTable("draft_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("draft"),
  email: text("email").notNull(),
  totalCents: integer("total_cents").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  netDays: integer("net_days").notNull().default(30),
  creditLimitCents: integer("credit_limit_cents").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull(),
});

export const priceLists = sqliteTable("price_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tiersJson: text("tiers_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
});

export const taxExemptions = sqliteTable("tax_exemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  code: text("code").notNull(),
  createdAt: text("created_at").notNull(),
});

export const shippingLabels = sqliteTable("shipping_labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  carrier: text("carrier").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  amountCents: integer("amount_cents").notNull(),
  trackingStatus: text("tracking_status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const fraudSignals = sqliteTable("fraud_signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id"),
  avs: text("avs").notNull(),
  held: integer("held", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const stockTransfers = sqliteTable("stock_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromLocationId: integer("from_location_id").notNull(),
  toLocationId: integer("to_location_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: text("created_at").notNull(),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  ordered: integer("ordered").notNull(),
  received: integer("received").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const installedApps = sqliteTable("installed_apps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  scopesJson: text("scopes_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
});

export const kitComponents = sqliteTable("kit_components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kitProductId: integer("kit_product_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
});
