import { db } from './db';

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'child',
    avatar_emoji  TEXT DEFAULT '🐷',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS deposits (
    id                          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    account_id                  TEXT NOT NULL REFERENCES accounts(id),
    name                        TEXT NOT NULL,
    type                        TEXT NOT NULL DEFAULT 'flexible',
    principal_agorot            INTEGER NOT NULL,
    balance_agorot              INTEGER NOT NULL,
    interest_rate_bps           INTEGER NOT NULL DEFAULT 500,
    term_days                   INTEGER,
    maturity_date               TEXT,
    early_withdrawal_penalty_pct INTEGER DEFAULT 50,
    status                      TEXT NOT NULL DEFAULT 'active',
    interest_last_accrued_at    TEXT NOT NULL DEFAULT (datetime('now')),
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    deposit_id           TEXT NOT NULL REFERENCES deposits(id),
    account_id           TEXT NOT NULL REFERENCES accounts(id),
    type                 TEXT NOT NULL,
    amount_agorot        INTEGER NOT NULL,
    balance_after_agorot INTEGER NOT NULL,
    description          TEXT,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id                        INTEGER PRIMARY KEY DEFAULT 1,
    default_flexible_rate_bps INTEGER NOT NULL DEFAULT 300,
    default_fixed_rate_bps    INTEGER NOT NULL DEFAULT 600,
    default_penalty_pct       INTEGER NOT NULL DEFAULT 50,
    min_deposit_agorot        INTEGER NOT NULL DEFAULT 1000,
    currency_symbol           TEXT NOT NULL DEFAULT '₪',
    updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_deposits_account ON deposits(account_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_deposit ON transactions(deposit_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`,
];

const SEED_SETTINGS = `INSERT OR IGNORE INTO settings (id) VALUES (1)`;

export async function initializeDatabase() {
  for (const sql of SCHEMA_SQL) {
    await db.execute(sql);
  }
  await db.execute(SEED_SETTINGS);
}
