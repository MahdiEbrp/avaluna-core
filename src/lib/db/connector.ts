import { createClient, type Client, type InStatement, type Transaction } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import {
  assertSafeRemoteDatabaseHost,
  isSqliteFamily,
  parseDatabaseUrl,
  type ParsedDatabaseUrl,
} from "../../domain/db-url";
import { assertSafeStaticSql, normalizeStatement } from "../../domain/sql-safety";
import type { DatabaseConnector } from "./connector-types";
import { openMysqlConnector } from "./drivers/mysql";
import { openPostgresConnector } from "./drivers/postgres";
import { wrapNativeHealth } from "./health-layer";

export type { DatabaseConnector, SqlResult, SqlInput } from "./connector-types";

export type ConnectorEnv = {
  DATABASE_URL?: string;
  DATABASE_DIALECT?: string;
  DATABASE_AUTH_TOKEN?: string;
  DATABASE_ENABLE_REMOTE?: string;
  NODE_ENV?: string;
};

export type ConnectorHooks = {
  openRemote?: (parsed: ParsedDatabaseUrl) => DatabaseConnector;
};

function defaultSqliteUrl(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "avaluna.sqlite")}`;
}

function openLibsql(parsed: ParsedDatabaseUrl, authToken?: string): DatabaseConnector {
  const client = createClient({ url: parsed.raw, authToken });
  let txn: Transaction | null = null;
  const exec = async (stmt: InStatement, extraArgs?: unknown) => {
    const sql = typeof stmt === "string" ? stmt : stmt.sql;
    const args = typeof stmt === "string" ? extraArgs : stmt.args;
    assertSafeStaticSql(sql);
    const runner = txn ?? client;
    return runner.execute({ sql, args: (args ?? []) as never });
  };
  const run = async (input: string | { sql: string; args?: readonly unknown[] }) => {
    const stmt = normalizeStatement(input);
    const result = await exec({ sql: stmt.sql, args: stmt.args as never });
    return { rows: result.rows as unknown as Record<string, unknown>[] };
  };
  const facade = new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "execute") {
        return exec;
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as Client;
  return {
    dialect: parsed.dialect,
    parsed,
    libsql: facade,
    execute: run,
    ping: async () => {
      await client.execute("SELECT 1");
      return true;
    },
    begin: async () => {
      if (txn) {
        return;
      }
      txn = await client.transaction("write");
    },
    commit: async () => {
      if (!txn) {
        return;
      }
      await txn.commit();
      txn = null;
    },
    rollback: async () => {
      if (!txn) {
        return;
      }
      try {
        await txn.rollback();
      } finally {
        txn = null;
      }
    },
    close: () => client.close(),
  };
}

function missingRemote(parsed: ParsedDatabaseUrl): DatabaseConnector {
  const fail = async (): Promise<never> => {
    throw new Error(`database.driver_unavailable:${parsed.dialect}`);
  };
  return {
    dialect: parsed.dialect,
    parsed,
    libsql: null,
    execute: fail,
    ping: async () => false,
    begin: fail,
    commit: fail,
    rollback: fail,
  };
}

export function createConnector(env: ConnectorEnv = process.env, hooks: ConnectorHooks = {}): DatabaseConnector {
  const raw = env.DATABASE_URL?.trim() || defaultSqliteUrl();
  const parsed = parseDatabaseUrl(raw, env.DATABASE_DIALECT);
  const production = env.NODE_ENV === "production";
  assertSafeRemoteDatabaseHost(parsed.host, production);
  if (isSqliteFamily(parsed.dialect)) {
    return wrapNativeHealth(openLibsql(parsed, env.DATABASE_AUTH_TOKEN));
  }
  if (hooks.openRemote) {
    return wrapNativeHealth(hooks.openRemote(parsed));
  }
  if (env.DATABASE_ENABLE_REMOTE === "yes" && parsed.dialect === "postgres") {
    return wrapNativeHealth(openPostgresConnector(parsed));
  }
  if (env.DATABASE_ENABLE_REMOTE === "yes" && parsed.dialect === "mysql") {
    return wrapNativeHealth(openMysqlConnector(parsed));
  }
  return wrapNativeHealth(missingRemote(parsed));
}

export function describeConnector(connector: DatabaseConnector) {
  return {
    dialect: connector.dialect,
    url: connector.parsed.redacted,
    tls: connector.parsed.tls,
    host: connector.parsed.host,
  };
}
