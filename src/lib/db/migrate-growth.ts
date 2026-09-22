export const statements = [
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    interval_days INTEGER NOT NULL DEFAULT 30,
    amount_cents INTEGER NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 0,
    next_billing_at_ms INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS draft_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    email TEXT NOT NULL,
    total_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    net_days INTEGER NOT NULL DEFAULT 30,
    credit_limit_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS price_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tiers_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tax_exemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS shipping_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    carrier TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    tracking_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS fraud_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    avs TEXT NOT NULL,
    held INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS stock_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_location_id INTEGER NOT NULL,
    to_location_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    ordered INTEGER NOT NULL,
    received INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS installed_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    scopes_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS kit_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kit_product_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  );`,
];
