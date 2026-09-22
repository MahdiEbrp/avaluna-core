import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const paymentCharges = sqliteTable("payment_charges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("IRR"),
  status: text("status").notNull(),
  reference: text("reference").notNull(),
  orderId: integer("order_id"),
  createdAt: text("created_at").notNull(),
});

export const messageOutbox = sqliteTable("message_outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channel: text("channel").notNull(),
  provider: text("provider").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull(),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at").notNull(),
});

export const cronJobs = sqliteTable("cron_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  expression: text("expression").notNull(),
  handler: text("handler").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  lastRunAt: text("last_run_at"),
  nextRunAtMs: integer("next_run_at_ms"),
  createdAt: text("created_at").notNull(),
});
