export const statements = [
  `CREATE TABLE IF NOT EXISTS payment_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IRR',
    status TEXT NOT NULL,
    reference TEXT NOT NULL,
    order_id INTEGER,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS message_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    provider TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS cron_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    expression TEXT NOT NULL,
    handler TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_at TEXT,
    next_run_at_ms INTEGER,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS app_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    code TEXT NOT NULL,
    sealed TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
];
