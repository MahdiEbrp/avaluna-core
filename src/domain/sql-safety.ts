const MULTI = /;\s*\S/;
const COMMENT = /--|\/\*|\*\//;

export function assertSafeStaticSql(sql: string): void {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new Error("sql.empty");
  }
  if (MULTI.test(trimmed)) {
    throw new Error("sql.multi_statement");
  }
  if (COMMENT.test(trimmed)) {
    throw new Error("sql.comment_forbidden");
  }
}

export function placeholders(dialect: "sqlite" | "libsql" | "postgres" | "mysql", count: number): string[] {
  if (count < 0) {
    return [];
  }
  return Array.from({ length: count }, (_, index) => (dialect === "postgres" ? `$${index + 1}` : "?"));
}

export type SqlStatement = { sql: string; args: readonly unknown[] };

export function normalizeStatement(input: string | { sql: string; args?: readonly unknown[] }): SqlStatement {
  if (typeof input === "string") {
    return { sql: input, args: [] };
  }
  return { sql: input.sql, args: input.args ?? [] };
}
