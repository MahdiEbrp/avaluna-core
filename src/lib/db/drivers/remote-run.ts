import { beginSql, type DbDialect, type ParsedDatabaseUrl } from "../../../domain/db-url";
import { assertSafeStaticSql, normalizeStatement } from "../../../domain/sql-safety";
import type { DatabaseConnector, SqlInput } from "../connector-types";

export function rewritePlaceholders(sql: string, dialect: DbDialect): string {
  if (dialect !== "postgres") {
    return sql;
  }
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

export function remoteConnector(
  parsed: ParsedDatabaseUrl,
  dialect: DbDialect,
  query: (sql: string, args: readonly unknown[]) => Promise<Record<string, unknown>[]>,
): DatabaseConnector {
  const run = async (input: SqlInput) => {
    const stmt = normalizeStatement(input);
    assertSafeStaticSql(stmt.sql);
    const sql = rewritePlaceholders(stmt.sql, dialect);
    const rows = await query(sql, stmt.args);
    return { rows };
  };
  return {
    dialect,
    parsed,
    libsql: null,
    execute: run,
    ping: async () => {
      await run("SELECT 1");
      return true;
    },
    begin: async () => {
      await run(beginSql(dialect));
    },
    commit: async () => {
      await run("COMMIT");
    },
    rollback: async () => {
      try {
        await run("ROLLBACK");
      } catch {
        // no active transaction
      }
    },
  };
}
