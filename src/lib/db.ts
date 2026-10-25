import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/**
 * Schema migrations. Append new entries; never edit or reorder existing ones,
 * because databases that already ran them will not run them again.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE media (
    id TEXT PRIMARY KEY,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    sizes TEXT NOT NULL,              -- JSON array of generated widths
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_km TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE collections (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_km TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    description_km TEXT NOT NULL DEFAULT '',
    image_id TEXT REFERENCES media(id) ON DELETE SET NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_km TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    description_km TEXT NOT NULL DEFAULT '',
    material_en TEXT NOT NULL DEFAULT '',
    material_km TEXT NOT NULL DEFAULT '',
    weight TEXT NOT NULL DEFAULT '',
    price INTEGER,                    -- minor units: US cents or whole riel; NULL = price on request
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','KHR')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    availability TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability IN ('in_stock','made_to_order','sold_out')),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_sample INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_at TEXT
  );
  CREATE INDEX products_status ON products(status, sort);
  CREATE INDEX products_category ON products(category_id);

  CREATE TABLE product_images (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, media_id)
  );

  CREATE TABLE product_collections (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE owners (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE login_attempts (
    key TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE INDEX login_attempts_key ON login_attempts(key, at);
  `,
  // Gold weight in grams, shown in ដំឡឹង / ជី / ហ៊ុន. Prices are no longer shown;
  // the old price, currency and free-text weight columns are left in place unused.
  `
  ALTER TABLE products ADD COLUMN weight_grams REAL;
  `,
  // Metal type: kilo gold or a platinum grade (see lib/metal.ts). NULL = not set.
  `
  ALTER TABLE products ADD COLUMN metal_type TEXT;
  CREATE INDEX products_metal_type ON products(metal_type);
  `,
  // Platinum 7.5 is no longer sold; its products go back to "not set" for the owner to choose.
  `
  UPDATE products SET metal_type = NULL WHERE metal_type = 'platinum_7_5';
  `,
  // Collections (Bridal, …) were removed; products are grouped by category only, which the
  // site calls "collections". Their photos become unreferenced and are cleaned up as orphans.
  `
  DROP TABLE product_collections;
  DROP TABLE collections;
  `,
  // The Visit banner no longer has a photo (the map, when set, sits beside the text instead).
  // Its old photo becomes unreferenced and is cleaned up as an orphan.
  `
  UPDATE settings SET value = json_remove(value, '$.story.imageId') WHERE key = 'home' AND json_valid(value);
  `,
  // A Telegram bot for the gold prices was added here and later removed. Both steps stay so the
  // migration numbers match databases that already ran them; the next step undoes this one.
  `
  ALTER TABLE owners ADD COLUMN telegram_user_id INTEGER;
  CREATE UNIQUE INDEX owners_telegram ON owners(telegram_user_id) WHERE telegram_user_id IS NOT NULL;
  CREATE TABLE telegram_links (code_hash TEXT PRIMARY KEY, owner_id INTEGER NOT NULL, expires_at INTEGER NOT NULL);
  CREATE TABLE telegram_state (chat_id INTEGER PRIMARY KEY, step TEXT NOT NULL, metal TEXT, draft TEXT NOT NULL, updated_at INTEGER NOT NULL);
  `,
  `
  DROP TABLE telegram_state;
  DROP TABLE telegram_links;
  DROP INDEX owners_telegram;
  ALTER TABLE owners DROP COLUMN telegram_user_id;
  `,
  // Telegram bot, second version: owners are listed in TELEGRAM_OWNER_IDS; only the
  // in-progress price draft of each chat is stored (see lib/telegram.ts).
  `
  CREATE TABLE telegram_state (
    chat_id INTEGER PRIMARY KEY,
    step TEXT NOT NULL,
    metal TEXT,
    draft TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  `,
];

function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "sokchenda.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __sokChendaDb?: Database.Database };

export function getDb() {
  if (!globalForDb.__sokChendaDb) globalForDb.__sokChendaDb = open();
  return globalForDb.__sokChendaDb;
}
