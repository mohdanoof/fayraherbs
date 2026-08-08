// db.js — SQLite setup for Fayra Herbs orders.
// Uses a single file, fayra.db, created automatically in this folder.

const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'fayra.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    phone      TEXT,
    address    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total       REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending_payment',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL REFERENCES orders(id),
    product_id    TEXT NOT NULL,
    product_name  TEXT NOT NULL,
    unit_price    REAL NOT NULL,
    quantity      INTEGER NOT NULL
  );
`);

module.exports = db;
