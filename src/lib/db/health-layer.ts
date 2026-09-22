import { DATABASE } from "../../config/constants";
import {
  emptyHealthState,
  errorMessage,
  isDeadTransport,
  markHealthFail,
  markHealthOk,
  shouldOpenCircuit,
  shouldProbe,
  type ConnectorHealthPolicy,
  type ConnectorHealthState,
} from "../../domain/db-health";
import type { DatabaseConnector, SqlInput, SqlResult } from "./connector-types";

export type HealthClock = () => number;

const DEFAULT_POLICY: ConnectorHealthPolicy = {
  probeIntervalMs: DATABASE.HEALTH_PROBE_INTERVAL_MS,
  failBudget: DATABASE.HEALTH_FAIL_BUDGET,
  cooldownMs: DATABASE.HEALTH_COOLDOWN_MS,
};

export function wrapNativeHealth(
  inner: DatabaseConnector,
  clock: HealthClock = Date.now,
  policy: ConnectorHealthPolicy = DEFAULT_POLICY,
): DatabaseConnector {
  if (inner.nativeHealth) {
    return inner;
  }
  let state = emptyHealthState();
  let inTransaction = false;

  const fail = (error: unknown): never => {
    const message = errorMessage(error);
    state = markHealthFail(state, clock(), message);
    throw error;
  };

  const pingInner = async (): Promise<boolean> => {
    try {
      const ok = await inner.ping();
      if (ok) {
        state = markHealthOk(clock());
        return true;
      }
      state = markHealthFail(state, clock(), "database.ping_failed");
      return false;
    } catch (error) {
      state = markHealthFail(state, clock(), errorMessage(error));
      return false;
    }
  };

  const ensureHealthy = async (): Promise<void> => {
    const now = clock();
    if (shouldOpenCircuit(state, now, policy)) {
      throw new Error(state.lastError ?? "database.unhealthy");
    }
    if (!shouldProbe(state, now, policy.probeIntervalMs)) {
      return;
    }
    const ok = await pingInner();
    if (!ok) {
      throw new Error(state.lastError ?? "database.unhealthy");
    }
  };

  const execute = async (input: SqlInput): Promise<SqlResult> => {
    if (!inTransaction) {
      await ensureHealthy();
    }
    try {
      return await inner.execute(input);
    } catch (error) {
      if (isDeadTransport(errorMessage(error))) {
        fail(error);
      }
      throw error;
    }
  };

  return {
    dialect: inner.dialect,
    parsed: inner.parsed,
    libsql: inner.libsql,
    nativeHealth: true,
    snapshot: () => ({ ...state }),
    execute,
    ping: async () => {
      const now = clock();
      if (shouldOpenCircuit(state, now, policy)) {
        return false;
      }
      return pingInner();
    },
    begin: async () => {
      await ensureHealthy();
      await inner.begin();
      inTransaction = true;
    },
    commit: async () => {
      inTransaction = false;
      await inner.commit();
    },
    rollback: async () => {
      inTransaction = false;
      await inner.rollback();
    },
    close: inner.close,
  };
}

export type { ConnectorHealthState };
