export const statements = [
  `CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    topic TEXT NOT NULL,
    delivery_url TEXT NOT NULL,
    secret TEXT NOT NULL,
    failure_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    request_body TEXT NOT NULL,
    response_code INTEGER,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    "group" TEXT NOT NULL,
    id TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS locations_code_uq ON locations(code);`,
  `CREATE TABLE IF NOT EXISTS inventory_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variation_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variation_id INTEGER,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS product_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    related_product_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS collection_products (
    collection_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS wishlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wishlist_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS gift_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    balance_cents INTEGER NOT NULL,
    disabled INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_code_uq ON gift_cards(code);`,
  `CREATE TABLE IF NOT EXISTS customer_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS customer_group_members (
    group_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'shipping',
    line1 TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    postcode TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate REAL NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS fulfillments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    tracking_number TEXT,
    carrier TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS fulfillment_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fulfillment_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS return_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS return_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL DEFAULT 'email',
    template TEXT NOT NULL,
    recipient TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS loyalty_accounts (
    customer_id INTEGER PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS rate_buckets (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at_ms INTEGER NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS inventory_levels_loc_product_uq ON inventory_levels(location_id, product_id, COALESCE(variation_id, 0));`,
  `CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS inventory_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    variation_id INTEGER,
    quantity INTEGER NOT NULL,
    expires_at_ms INTEGER NOT NULL,
    released INTEGER NOT NULL DEFAULT 0,
    cart_id INTEGER,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS payment_intents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IRR',
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requires_action',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
];
