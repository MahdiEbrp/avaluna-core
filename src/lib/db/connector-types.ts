import type { Client } from "@libsql/client";
import type { DbDialect, ParsedDatabaseUrl } from "../../domain/db-url";
import type { ConnectorHealthState } from "../../domain/db-health";

export type SqlResult = { rows: Record<string, unknown>[] };

export type SqlInput = string | { sql: string; args?: readonly unknown[] };

export type DatabaseConnector = {
  dialect: DbDialect;
  parsed: ParsedDatabaseUrl;
  execute: (input: SqlInput) => Promise<SqlResult>;
  ping: () => Promise<boolean>;
  begin: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  close?: () => void;
  libsql: Client | null;
  nativeHealth?: boolean;
  snapshot?: () => ConnectorHealthState;
};
