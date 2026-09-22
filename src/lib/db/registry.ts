import { createConnector, describeConnector, type ConnectorEnv, type ConnectorHooks, type DatabaseConnector } from "./connector";

export type ConnectorRegistry = {
  primary: DatabaseConnector;
  replica: DatabaseConnector | null;
  named: Record<string, DatabaseConnector>;
};

function parseNamed(raw: string | undefined): Record<string, string> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        out[key] = value.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function createRegistry(env: ConnectorEnv & { DATABASE_REPLICA_URL?: string; DATABASE_CONNECTORS?: string } = process.env, hooks: ConnectorHooks = {}): ConnectorRegistry {
  const primary = createConnector(env, hooks);
  const replica = env.DATABASE_REPLICA_URL
    ? createConnector({ ...env, DATABASE_URL: env.DATABASE_REPLICA_URL }, hooks)
    : null;
  const named: Record<string, DatabaseConnector> = {};
  for (const [name, url] of Object.entries(parseNamed(env.DATABASE_CONNECTORS))) {
    named[name] = createConnector({ ...env, DATABASE_URL: url }, hooks);
  }
  return { primary, replica, named };
}

function describeHealthy(connector: DatabaseConnector) {
  const snap = connector.snapshot?.();
  return {
    ...describeConnector(connector),
    healthy: snap?.healthy ?? null,
    consecutive_failures: snap?.consecutiveFailures ?? 0,
  };
}

export function healthConnectors(registry: ConnectorRegistry) {
  const extras = Object.fromEntries(
    Object.entries(registry.named).map(([name, connector]) => [name, describeHealthy(connector)]),
  );
  return {
    primary: describeHealthy(registry.primary),
    replica: registry.replica ? describeHealthy(registry.replica) : null,
    named: extras,
  };
}

export async function pingConnectors(registry: ConnectorRegistry) {
  const primary = await registry.primary.ping().catch(() => false);
  const replica = registry.replica ? await registry.replica.ping().catch(() => false) : null;
  const named: Record<string, boolean> = {};
  for (const [name, connector] of Object.entries(registry.named)) {
    named[name] = await connector.ping().catch(() => false);
  }
  return { primary, replica, named };
}
