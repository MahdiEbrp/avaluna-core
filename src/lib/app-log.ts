import { LOG } from "../config/constants";
import { logCutoffIso, logPlaintext, type LogLevel } from "../domain/log-files";
import { isSealed, sealSecret } from "./settings/secrets";
import { nowIso } from "./time";

const INSERT_SQL = "INSERT INTO app_logs (level, code, sealed, created_at) VALUES (?, ?, ?, ?)";
const DELETE_SQL = "DELETE FROM app_logs WHERE created_at < ?";

async function connector() {
  const { connector: dbConnector } = await import("./db/client");
  return dbConnector;
}

export async function appendAppLog(level: LogLevel, code: string, message: string, atIso = nowIso()): Promise<void> {
  try {
    const sealed = sealSecret(logPlaintext(atIso, level, code, message));
    if (!isSealed(sealed)) {
      return;
    }
    const db = await connector();
    await db.execute({ sql: INSERT_SQL, args: [level, code, sealed, atIso] });
  } catch {
    // logging must not break callers
  }
}

export async function cleanupAppLogs(nowMs = Date.now()): Promise<{ deleted: number }> {
  const db = await connector();
  const before = await db.execute("SELECT COUNT(*) AS c FROM app_logs");
  await db.execute({ sql: DELETE_SQL, args: [logCutoffIso(nowMs, LOG.RETENTION_DAYS)] });
  const after = await db.execute("SELECT COUNT(*) AS c FROM app_logs");
  const start = Number((before.rows[0] as { c?: number })?.c ?? 0);
  const end = Number((after.rows[0] as { c?: number })?.c ?? 0);
  return { deleted: Math.max(0, start - end) };
}
