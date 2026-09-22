import { drizzle } from "drizzle-orm/libsql";
import { ApiError } from "../errors";
import * as schema from "./schema";
import { createRegistry } from "./registry";
import type { DatabaseConnector } from "./connector";

export const registry = createRegistry();
export const connector: DatabaseConnector = registry.primary;

if (!connector.libsql) {
  throw new ApiError(
    503,
    "database.driver_unavailable",
    "Primary DATABASE_URL must be sqlite or libsql for this process (postgres/mysql are extra connectors).",
  );
}

export const sqlite = connector.libsql;
export const db = drizzle(sqlite, { schema });
export type Database = typeof db;

let writeDepth = 0;

export async function withWriteTransaction<T>(work: () => Promise<T>): Promise<T> {
  if (writeDepth > 0) {
    return work();
  }
  writeDepth += 1;
  await connector.begin();
  try {
    const result = await work();
    await connector.commit();
    return result;
  } catch (error) {
    await connector.rollback();
    throw error;
  } finally {
    writeDepth -= 1;
  }
}
