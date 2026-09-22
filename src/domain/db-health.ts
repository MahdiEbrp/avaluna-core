export type ConnectorHealthState = {
  healthy: boolean;
  consecutiveFailures: number;
  lastOkAtMs: number | null;
  lastFailAtMs: number | null;
  lastError: string | null;
};

export type ConnectorHealthPolicy = {
  probeIntervalMs: number;
  failBudget: number;
  cooldownMs: number;
};

export const NATIVE_PING_SQL = "SELECT 1";

const DEAD_TRANSPORT = [
  "econnreset",
  "econnrefused",
  "etimedout",
  "enotfound",
  "protocol_connection_lost",
  "connection terminated",
  "server closed the connection",
  "driver_unavailable",
] as const;

export function emptyHealthState(): ConnectorHealthState {
  return {
    healthy: false,
    consecutiveFailures: 0,
    lastOkAtMs: null,
    lastFailAtMs: null,
    lastError: null,
  };
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function isDeadTransport(message: string): boolean {
  const lower = message.toLowerCase();
  return DEAD_TRANSPORT.some((token) => lower.includes(token));
}

export function shouldProbe(state: ConnectorHealthState, nowMs: number, intervalMs: number): boolean {
  if (!state.healthy || state.lastOkAtMs === null) {
    return true;
  }
  return nowMs - state.lastOkAtMs >= intervalMs;
}

export function shouldOpenCircuit(state: ConnectorHealthState, nowMs: number, policy: ConnectorHealthPolicy): boolean {
  if (state.consecutiveFailures < policy.failBudget) {
    return false;
  }
  if (state.lastFailAtMs === null) {
    return true;
  }
  return nowMs - state.lastFailAtMs < policy.cooldownMs;
}

export function markHealthOk(nowMs: number): ConnectorHealthState {
  return {
    healthy: true,
    consecutiveFailures: 0,
    lastOkAtMs: nowMs,
    lastFailAtMs: null,
    lastError: null,
  };
}

export function markHealthFail(state: ConnectorHealthState, nowMs: number, message: string): ConnectorHealthState {
  return {
    healthy: false,
    consecutiveFailures: state.consecutiveFailures + 1,
    lastOkAtMs: state.lastOkAtMs,
    lastFailAtMs: nowMs,
    lastError: message,
  };
}
