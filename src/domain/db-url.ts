export const DB_DIALECTS = ["sqlite", "libsql", "postgres", "mysql"] as const;
export type DbDialect = (typeof DB_DIALECTS)[number];

const PROTOCOL_TO_DIALECT: Record<string, DbDialect> = {
  file: "sqlite",
  sqlite: "sqlite",
  "sqlite+file": "sqlite",
  libsql: "libsql",
  "libsql+wss": "libsql",
  "libsql+https": "libsql",
  postgres: "postgres",
  postgresql: "postgres",
  "postgres+ssl": "postgres",
  mysql: "mysql",
  mariadb: "mysql",
};

const BLOCKED_HOSTS = new Set(["169.254.169.254", "metadata.google.internal", "localhost", "127.0.0.1", "0.0.0.0"]);

export type ParsedDatabaseUrl = {
  dialect: DbDialect;
  protocol: string;
  host: string | null;
  pathname: string;
  redacted: string;
  tls: boolean;
  raw: string;
};

export function redactDatabaseUrl(raw: string): string {
  try {
    if (raw.startsWith("file:")) {
      return "file:***";
    }
    const url = new URL(raw);
    if (url.password) {
      url.password = "***";
    }
    if (url.username) {
      url.username = url.username ? "***" : "";
    }
    return url.toString();
  } catch {
    return "[invalid-database-url]";
  }
}

export function dialectFromProtocol(protocol: string): DbDialect | null {
  const key = protocol.replace(/:$/, "").toLowerCase();
  return PROTOCOL_TO_DIALECT[key] ?? null;
}

export function parseDatabaseUrl(raw: string, override?: string): ParsedDatabaseUrl {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("database.url_required");
  }
  if (override && (DB_DIALECTS as readonly string[]).includes(override)) {
    return finishParse(trimmed, override as DbDialect);
  }
  if (trimmed.startsWith("file:") || trimmed.endsWith(".sqlite") || trimmed.endsWith(".db")) {
    return finishParse(trimmed.startsWith("file:") ? trimmed : `file:${trimmed}`, "sqlite");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("database.invalid_url");
  }
  const dialect = dialectFromProtocol(url.protocol);
  if (!dialect) {
    throw new Error("database.unknown_dialect");
  }
  return finishParse(trimmed, dialect, url);
}

function finishParse(raw: string, dialect: DbDialect, url?: URL): ParsedDatabaseUrl {
  const parsed = url ?? (raw.startsWith("file:") ? null : safeUrl(raw));
  const protocol = parsed?.protocol.replace(/:$/, "") ?? "file";
  const tls = protocol.includes("ssl") || protocol === "libsql" || protocol === "https" || parsed?.searchParams.get("ssl") === "true";
  return {
    dialect,
    protocol,
    host: parsed?.hostname ?? null,
    pathname: parsed?.pathname ?? raw.replace(/^file:/, ""),
    redacted: redactDatabaseUrl(raw),
    tls,
    raw,
  };
}

function safeUrl(raw: string): URL | undefined {
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export function assertSafeRemoteDatabaseHost(host: string | null, production: boolean): void {
  if (!host) {
    return;
  }
  const normalized = host.toLowerCase();
  if (BLOCKED_HOSTS.has(normalized) && production) {
    throw new Error("database.ssrf_blocked");
  }
  if (/^(10\.|192\.168\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(normalized) && production) {
    throw new Error("database.ssrf_blocked");
  }
}

export function beginSql(dialect: DbDialect): string {
  return dialect === "sqlite" || dialect === "libsql" ? "BEGIN IMMEDIATE" : "BEGIN";
}

export function isSqliteFamily(dialect: DbDialect): boolean {
  return dialect === "sqlite" || dialect === "libsql";
}
