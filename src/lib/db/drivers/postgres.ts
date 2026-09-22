import type { ParsedDatabaseUrl } from "../../../domain/db-url";
import type { DatabaseConnector } from "../connector-types";
import { remoteConnector } from "./remote-run";

export function openPostgresConnector(parsed: ParsedDatabaseUrl): DatabaseConnector {
  let pool: { unsafe: (text: string, values?: unknown[]) => Promise<Record<string, unknown>[]> } | null = null;
  const query = async (sql: string, args: readonly unknown[]) => {
    if (!pool) {
      try {
        const mod = (await import(/* webpackIgnore: true */ "postgres")) as {
          default: (url: string, opts?: object) => {
            unsafe: (text: string, values?: unknown[]) => Promise<Record<string, unknown>[]>;
          };
        };
        pool = mod.default(parsed.raw, { max: 1, connect_timeout: 4, idle_timeout: 4 });
      } catch {
        throw new Error("database.driver_unavailable:postgres");
      }
    }
    const rows = await pool.unsafe(sql, [...args]);
    return Array.isArray(rows) ? rows : [];
  };
  return remoteConnector(parsed, "postgres", query);
}
