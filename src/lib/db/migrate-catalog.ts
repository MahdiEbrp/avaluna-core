export const statements = [
  `PRAGMA journal_mode = WAL;`,
  `PRAGMA foreign_keys = ON;`,
  `PRAGMA busy_timeout = 5000;`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL,
    billing_json TEXT NOT NULL DEFAULT '{}',
    shipping_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users(email);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users(username);`,
  `CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    consumer_key TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT 'read',
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    revoked_at TEXT
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS api_keys_ck_uq ON api_keys(consumer_key);`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id INTEGER,
    description TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'select'
  );`,
  `CREATE TABLE IF NOT EXISTS attribute_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS shipping_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_fa TEXT NOT NULL DEFAULT '',
    slug TEXT NOT NULL,
    slug_fa TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'simple',
    status TEXT NOT NULL DEFAULT 'publish',
    description TEXT NOT NULL DEFAULT '',
    description_fa TEXT NOT NULL DEFAULT '',
    short_description TEXT NOT NULL DEFAULT '',
    sku TEXT,
    regular_price_cents INTEGER NOT NULL DEFAULT 0,
    sale_price_cents INTEGER,
    on_sale INTEGER NOT NULL DEFAULT 0,
    virtual INTEGER NOT NULL DEFAULT 0,
    downloadable INTEGER NOT NULL DEFAULT 0,
    downloads_json TEXT NOT NULL DEFAULT '[]',
    tax_class TEXT NOT NULL DEFAULT 'standard',
    manage_stock INTEGER NOT NULL DEFAULT 1,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    stock_status TEXT NOT NULL DEFAULT 'instock',
    backorders TEXT NOT NULL DEFAULT 'no',
    weight TEXT NOT NULL DEFAULT '',
    length TEXT NOT NULL DEFAULT '',
    width TEXT NOT NULL DEFAULT '',
    height TEXT NOT NULL DEFAULT '',
    shipping_class_id INTEGER,
    featured INTEGER NOT NULL DEFAULT 0,
    catalog_visibility TEXT NOT NULL DEFAULT 'visible',
    external_url TEXT,
    button_text TEXT,
    menu_order INTEGER NOT NULL DEFAULT 0,
    average_rating REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uq ON products(slug);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS products_sku_uq ON products(sku);`,
  `CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);`,
  `CREATE INDEX IF NOT EXISTS products_type_idx ON products(type);`,
  `CREATE INDEX IF NOT EXISTS products_stock_idx ON products(stock_status);`,
  `CREATE INDEX IF NOT EXISTS products_price_idx ON products(regular_price_cents);`,
  `CREATE TABLE IF NOT EXISTS product_variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    regular_price_cents INTEGER NOT NULL DEFAULT 0,
    sale_price_cents INTEGER,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    stock_status TEXT NOT NULL DEFAULT 'instock',
    attributes_json TEXT NOT NULL DEFAULT '{}',
    image_url TEXT
  );`,
  `CREATE INDEX IF NOT EXISTS variations_product_idx ON product_variations(product_id);`,
  `CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS product_tags (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reviewer TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    review TEXT NOT NULL,
    rating INTEGER NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );`,
];
