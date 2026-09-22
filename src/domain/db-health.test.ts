import { describe, expect, it } from "vitest";
import {
  emptyHealthState,
  errorMessage,
  isDeadTransport,
  markHealthFail,
  markHealthOk,
  NATIVE_PING_SQL,
  shouldOpenCircuit,
  shouldProbe,
} from "./db-health";
import { wrapNativeHealth } from "../lib/db/health-layer";
import { parseDatabaseUrl } from "./db-url";
import type { DatabaseConnector } from "../lib/db/connector-types";

const policy = { probeIntervalMs: 1_000, failBudget: 2, cooldownMs: 5_000 };

function fakeConnector(overrides: Partial<DatabaseConnector> = {}): DatabaseConnector {
  const parsed = parseDatabaseUrl("postgres://u:p@db.example/shop");
  return {
    dialect: "postgres",
    parsed,
    libsql: null,
    execute: async () => ({ rows: [{ ok: 1 }] }),
    ping: async () => true,
    begin: async () => undefined,
    commit: async () => undefined,
    rollback: async () => undefined,
    ...overrides,
  };
}

describe("db health policy", () => {
  it("probes, circuits, and classifies transport death", () => {
    expect(NATIVE_PING_SQL).toBe("SELECT 1");
    const empty = emptyHealthState();
    expect(shouldProbe(empty, 10, 1_000)).toBe(true);
    const ok = markHealthOk(100);
    expect(shouldProbe(ok, 100, 1_000)).toBe(false);
    expect(shouldProbe(ok, 1_200, 1_000)).toBe(true);
    expect(shouldOpenCircuit(empty, 0, policy)).toBe(false);
    const one = markHealthFail(empty, 10, "econnreset");
    expect(shouldOpenCircuit(one, 11, policy)).toBe(false);
    const two = markHealthFail(one, 12, "econnreset");
    expect(shouldOpenCircuit(two, 13, policy)).toBe(true);
    expect(shouldOpenCircuit(two, 12 + 5_001, policy)).toBe(false);
    const noFailAt = { ...two, lastFailAtMs: null };
    expect(shouldOpenCircuit(noFailAt, 0, policy)).toBe(true);
    expect(isDeadTransport("ECONNRESET")).toBe(true);
    expect(isDeadTransport("database.driver_unavailable:mysql")).toBe(true);
    expect(isDeadTransport("unique constraint")).toBe(false);
    expect(errorMessage(new Error("x"))).toBe("x");
    expect(errorMessage("bare")).toBe("bare");
  });
});

describe("native health layer", () => {
  it("wraps once, probes, circuits, and maps dead transport", async () => {
    let now = 0;
    const inner = fakeConnector();
    const wrapped = wrapNativeHealth(inner, () => now, policy);
    expect(wrapNativeHealth(wrapped, () => now, policy)).toBe(wrapped);
    expect(wrapped.nativeHealth).toBe(true);
    expect(await wrapped.ping()).toBe(true);
    expect(wrapped.snapshot?.().healthy).toBe(true);
    now = 10;
    expect((await wrapped.execute("SELECT 1")).rows[0]?.ok).toBe(1);
    await wrapped.begin();
    expect((await wrapped.execute("SELECT 1")).rows[0]?.ok).toBe(1);
    await wrapped.commit();
    await wrapped.begin();
    await wrapped.rollback();
    const defaults = wrapNativeHealth(fakeConnector());
    expect(await defaults.ping()).toBe(true);
    defaults.close?.();

    let pings = 0;
    const flaky = fakeConnector({
      ping: async () => {
        pings += 1;
        return false;
      },
    });
    const down = wrapNativeHealth(flaky, () => now, policy);
    expect(await down.ping()).toBe(false);
    expect(await down.ping()).toBe(false);
    expect(await down.ping()).toBe(false);
    expect(pings).toBe(2);
    await expect(down.execute("SELECT 1")).rejects.toThrow("database.ping_failed");

    const boom = fakeConnector({
      ping: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    expect(await wrapNativeHealth(boom, () => now, policy).ping()).toBe(false);

    const dead = fakeConnector({
      execute: async () => {
        throw new Error("PROTOCOL_CONNECTION_LOST");
      },
    });
    const live = wrapNativeHealth(dead, () => now, policy);
    await live.ping();
    await expect(live.execute("SELECT 1")).rejects.toThrow("PROTOCOL_CONNECTION_LOST");
    expect(live.snapshot?.().healthy).toBe(false);

    const sqlErr = fakeConnector({
      execute: async () => {
        throw new Error("unique constraint");
      },
    });
    const sqlWrap = wrapNativeHealth(sqlErr, () => now, policy);
    await sqlWrap.ping();
    await expect(sqlWrap.execute("INSERT")).rejects.toThrow("unique constraint");
    expect(sqlWrap.snapshot?.().healthy).toBe(true);
  });
});
