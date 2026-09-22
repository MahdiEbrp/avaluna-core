import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const mediaFiles = sqliteTable("media_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const moadianSubmissions = sqliteTable("moadian_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  status: text("status").notNull(),
  reference: text("reference"),
  createdAt: text("created_at").notNull(),
});
