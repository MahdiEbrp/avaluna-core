import { describe, expect, it } from "vitest";
import {
  assertSafeRemoteDatabaseHost,
  beginSql,
  dialectFromProtocol,
  isSqliteFamily,
  parseDatabaseUrl,
  redactDatabaseUrl,
} from "./db-url";
import { assertSafeStaticSql, normalizeStatement, placeholders } from "./sql-safety";
import { createConnector, describeConnector } from "../lib/db/connector";
import { createRegistry, healthConnectors, pingConnectors } from "../lib/db/registry";
import { rewritePlaceholders } from "../lib/db/drivers/remote-run";

describe("database urls", () => {
  it("parses dialects and redacts secrets", () => {
    expect(parseDatabaseUrl("file:./data/avaluna.sqlite").dialect).toBe("sqlite");
    expect(parseDatabaseUrl("/tmp/store.db").dialect).toBe("sqlite");
    expect(parseDatabaseUrl("libsql://db.turso.io").dialect).toBe("libsql");
    expect(parseDatabaseUrl("postgres://u:secret@db.example:5432/shop").dialect).toBe("postgres");
    expect(parseDatabaseUrl("mysql://u:p@db.example/shop").dialect).toBe("mysql");
    expect(parseDatabaseUrl("postgresql://x@h/db", "sqlite").dialect).toBe("sqlite");
    expect(parseDatabaseUrl("%%%", "postgres").dialect).toBe("postgres");
    expect(redactDatabaseUrl("postgres://user:secret@host/db")).toContain("***");
    expect(redactDatabaseUrl("file:./x.sqlite")).toBe("file:***");
    expect(redactDatabaseUrl("not a url")).toBe("[invalid-database-url]");
    expect(dialectFromProtocol("mariadb")).toBe("mysql");
    expect(dialectFromProtocol("ftp")).toBeNull();
    expect(isSqliteFamily("libsql")).toBe(true);
    expect(beginSql("postgres")).toBe("BEGIN");
    expect(beginSql("sqlite")).toBe("BEGIN IMMEDIATE");
    expect(() => parseDatabaseUrl("")).toThrow("database.url_required");
    expect(() => parseDatabaseUrl("http://x")).toThrow("database.unknown_dialect");
    expect(() => parseDatabaseUrl("not://%")).toThrow();
    expect(() => assertSafeRemoteDatabaseHost("127.0.0.1", true)).toThrow("database.ssrf_blocked");
    expect(() => assertSafeRemoteDatabaseHost("10.0.0.5", true)).toThrow("database.ssrf_blocked");
    expect(() => assertSafeRemoteDatabaseHost("db.example", true)).not.toThrow();
    expect(() => assertSafeRemoteDatabaseHost("127.0.0.1", false)).not.toThrow();
    assertSafeRemoteDatabaseHost(null, true);
  });
});

describe("sql safety", () => {
  it("rejects multi-statement and comments", () => {
    expect(() => assertSafeStaticSql("")).toThrow("sql.empty");
    expect(() => assertSafeStaticSql("SELECT 1; DROP TABLE x")).toThrow("sql.multi_statement");
    expect(() => assertSafeStaticSql("SELECT 1 -- x")).toThrow("sql.comment_forbidden");
    expect(() => assertSafeStaticSql("SELECT /* x */ 1")).toThrow("sql.comment_forbidden");
    expect(() => assertSafeStaticSql("SELECT 1")).not.toThrow();
    expect(normalizeStatement("SELECT 1")).toEqual({ sql: "SELECT 1", args: [] });
    expect(normalizeStatement({ sql: "SELECT", args: [1] }).args).toEqual([1]);
    expect(normalizeStatement({ sql: "SELECT" }).args).toEqual([]);
    expect(placeholders("postgres", 2)).toEqual(["$1", "$2"]);
    expect(placeholders("mysql", 1)).toEqual(["?"]);
    expect(placeholders("sqlite", -1)).toEqual([]);
  });
});

describe("connectors", () => {
  it("opens sqlite and stubs remote dialects", async () => {
    const sqlite = createConnector({ DATABASE_URL: "file:./data/connector-test.sqlite" });
    expect(sqlite.dialect).toBe("sqlite");
    expect(await sqlite.ping()).toBe(true);
    await sqlite.execute("SELECT 1");
    sqlite.close?.();
    const pg = createConnector({ DATABASE_URL: "postgres://u:p@db.example/shop" });
    expect(pg.libsql).toBeNull();
    expect(pg.nativeHealth).toBe(true);
    expect(await pg.ping()).toBe(false);
    await expect(pg.execute("SELECT 1")).rejects.toThrow(/database\.(ping_failed|unhealthy|driver_unavailable)/);
    await expect(pg.begin()).rejects.toThrow(/database\.(ping_failed|unhealthy|driver_unavailable)/);
    await expect(pg.commit()).rejects.toThrow("database.driver_unavailable");
    await expect(pg.rollback()).rejects.toThrow("database.driver_unavailable");
    const hooked = createConnector(
      { DATABASE_URL: "mysql://u:p@db.example/shop" },
      {
        openRemote: (parsed) => ({
          dialect: parsed.dialect,
          parsed,
          libsql: null,
          execute: async () => ({ rows: [{ ok: 1 }] }),
          ping: async () => true,
          begin: async () => undefined,
          commit: async () => undefined,
          rollback: async () => undefined,
        }),
      },
    );
    expect(await hooked.ping()).toBe(true);
    expect(describeConnector(hooked).url).not.toContain("p@");
    const registry = createRegistry({
      DATABASE_URL: "file:./data/connector-test.sqlite",
      DATABASE_REPLICA_URL: "postgres://u:p@replica.example/shop",
      DATABASE_CONNECTORS: JSON.stringify({ analytics: "mysql://u:p@an.example/a", bad: 1, empty: "  " }),
    });
    expect(registry.replica?.dialect).toBe("postgres");
    expect(registry.named.analytics?.dialect).toBe("mysql");
    expect(healthConnectors(registry).replica?.dialect).toBe("postgres");
    const pings = await pingConnectors(registry);
    expect(pings.primary).toBe(true);
    expect(pings.replica).toBe(false);
    expect(pings.named.analytics).toBe(false);
    const emptyNamed = createRegistry({ DATABASE_CONNECTORS: "not-json" });
    expect(emptyNamed.named).toEqual({});
    const arrayNamed = createRegistry({ DATABASE_CONNECTORS: "[]" });
    expect(arrayNamed.named).toEqual({});
    expect(() =>
      createConnector({ DATABASE_URL: "postgres://u:p@127.0.0.1/db", NODE_ENV: "production" }),
    ).toThrow("database.ssrf_blocked");
    const remote = createConnector({
      DATABASE_URL: "postgres://u:p@db.example/shop",
      DATABASE_ENABLE_REMOTE: "yes",
    });
    expect(remote.dialect).toBe("postgres");
    expect(remote.libsql).toBeNull();
    const mysql = createConnector({
      DATABASE_URL: "mysql://u:p@db.example/shop",
      DATABASE_ENABLE_REMOTE: "yes",
    });
    expect(mysql.dialect).toBe("mysql");
    expect(rewritePlaceholders("SELECT ? FROM t WHERE x = ?", "postgres")).toBe("SELECT $1 FROM t WHERE x = $2");
    expect(rewritePlaceholders("SELECT ?", "mysql")).toBe("SELECT ?");
  });
});
