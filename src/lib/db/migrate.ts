import { connector } from "./client";
import { statements as catalogSql } from "./migrate-catalog";
import { statements as checkoutSql } from "./migrate-checkout";
import { statements as opsSql } from "./migrate-ops";
import { statements as gatewaySql } from "./migrate-gateways";
import { statements as growthSql } from "./migrate-growth";
import { statements as mediaSql } from "./migrate-media";

const statements = [...catalogSql, ...checkoutSql, ...opsSql, ...gatewaySql, ...growthSql, ...mediaSql];

let migrated = false;
let inflight: Promise<void> | null = null;

export async function migrate(): Promise<void> {
  if (migrated) {
    return;
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        for (const statement of statements) {
          await connector.execute(statement);
        }
        for (const extra of [
          "ALTER TABLE products ADD COLUMN name_fa TEXT NOT NULL DEFAULT ''",
          "ALTER TABLE products ADD COLUMN slug_fa TEXT NOT NULL DEFAULT ''",
          "ALTER TABLE products ADD COLUMN description_fa TEXT NOT NULL DEFAULT ''",
          "CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(name, name_fa, description, sku)",
          "ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'",
          "ALTER TABLE orders ADD COLUMN stock_taken INTEGER NOT NULL DEFAULT 0",
          "ALTER TABLE shipping_labels ADD COLUMN tracking_status TEXT NOT NULL DEFAULT 'pending'",
        ]) {
          try {
            await connector.execute(extra);
          } catch {
            // column or virtual table already exists
          }
        }
        migrated = true;
      } catch (error) {
        inflight = null;
        throw error;
      }
    })();
  }
  await inflight;
}
