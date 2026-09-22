import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("customer"),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    username: text("username").notNull(),
    billingJson: text("billing_json").notNull().default("{}"),
    shippingJson: text("shipping_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_username_uq").on(t.username),
    index("users_role_idx").on(t.role),
  ],
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    consumerKey: text("consumer_key").notNull(),
    secretHash: text("secret_hash").notNull(),
    permissions: text("permissions").notNull().default("read"),
    createdAt: text("created_at").notNull(),
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (t) => [
    uniqueIndex("api_keys_ck_uq").on(t.consumerKey),
    index("api_keys_user_idx").on(t.userId),
  ],
);
