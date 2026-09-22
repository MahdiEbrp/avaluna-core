import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function secretsDir(): string {
  const dir = path.join(process.cwd(), "data", ".secrets");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return dir;
}

/** Env in production; generated once under data/.secrets locally. Never a hardcoded passphrase. */
export function loadRuntimeSecret(envName: string, fileStem: string): string {
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${envName} is required in production`);
  }
  const file = path.join(secretsDir(), fileStem);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8").trim();
  }
  const generated = randomBytes(32).toString("base64url");
  fs.writeFileSync(file, generated, { mode: 0o600 });
  return generated;
}
