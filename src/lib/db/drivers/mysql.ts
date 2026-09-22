import type { ParsedDatabaseUrl } from "../../../domain/db-url";
import type { DatabaseConnector } from "../connector-types";
import { remoteConnector } from "./remote-run";

type MysqlConn = {
  execute: (sql: string, args?: unknown[]) => Promise<[Record<string, unknown>[]]>;
  end: () => Promise<void>;
};

export function openMysqlConnector(parsed: ParsedDatabaseUrl): DatabaseConnector {
  let conn: MysqlConn | null = null;
  const query = async (sql: string, args: readonly unknown[]) => {
    if (!conn) {
      try {
        const mod = (await import(/* webpackIgnore: true */ "mysql2/promise")) as {
          createConnection: (url: string) => Promise<MysqlConn>;
        };
        conn = await mod.createConnection(parsed.raw);
      } catch {
        throw new Error("database.driver_unavailable:mysql");
      }
    }
    const [rows] = await conn.execute(sql, [...args]);
    return Array.isArray(rows) ? rows : [];
  };
  const connector = remoteConnector(parsed, "mysql", query);
  connector.close = () => {
    void conn?.end();
  };
  return connector;
}
