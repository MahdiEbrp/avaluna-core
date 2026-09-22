import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { BACKUP } from "../../config/constants";
import { parseDatabaseUrl } from "../../domain/db-url";
import { ApiError } from "../errors";
import { nowIso } from "../time";

function backupDir(): string {
  return path.resolve(process.cwd(), BACKUP.DIR);
}

function sqlitePathFromEnv(): string {
  const raw = process.env.DATABASE_URL || "file:data/avaluna.sqlite";
  try {
    const parsed = parseDatabaseUrl(raw);
    if (parsed.dialect !== "sqlite") {
      throw new ApiError(503, "backup.unsupported_dialect", "File backup is only for sqlite file: URLs.");
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(503, "backup.unsupported_dialect", "File backup is only for sqlite file: URLs.");
  }
  const file = raw.replace(/^file:/, "");
  return path.resolve(process.cwd(), file);
}

export async function createSqliteBackup() {
  const src = sqlitePathFromEnv();
  await mkdir(backupDir(), { recursive: true });
  const name = `avaluna-${nowIso().replaceAll(":", "").replaceAll(".", "-")}.sqlite`;
  const dest = path.join(backupDir(), name);
  await copyFile(src, dest);
  const info = await stat(dest);
  return { file: name, bytes: info.size, created_at: nowIso() };
}

export async function listSqliteBackups() {
  await mkdir(backupDir(), { recursive: true });
  const names = await readdir(backupDir());
  const rows = [];
  for (const file of names.filter((name) => name.endsWith(".sqlite"))) {
    const info = await stat(path.join(backupDir(), file));
    rows.push({ file, bytes: info.size, created_at: new Date(info.mtimeMs).toISOString() });
  }
  return rows;
}
