export const statements = [
  `CREATE TABLE IF NOT EXISTS media_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mime TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS moadian_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    reference TEXT,
    created_at TEXT NOT NULL
  );`,
];
