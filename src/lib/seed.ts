import { createClient } from '@libsql/client';
import { hash } from 'bcryptjs';

async function seed() {
  const db = createClient({ url: 'file:local.db' });

  // Create tables
  const SCHEMA_SQL = [
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'child',
      avatar_emoji TEXT DEFAULT '🐷',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'flexible',
      principal_agorot INTEGER NOT NULL,
      balance_agorot INTEGER NOT NULL,
      interest_rate_bps INTEGER NOT NULL DEFAULT 500,
      term_days INTEGER,
      maturity_date TEXT,
      early_withdrawal_penalty_pct INTEGER DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'active',
      interest_last_accrued_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      deposit_id TEXT NOT NULL REFERENCES deposits(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      type TEXT NOT NULL,
      amount_agorot INTEGER NOT NULL,
      balance_after_agorot INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      default_flexible_rate_bps INTEGER NOT NULL DEFAULT 300,
      default_fixed_rate_bps INTEGER NOT NULL DEFAULT 600,
      default_penalty_pct INTEGER NOT NULL DEFAULT 50,
      min_deposit_agorot INTEGER NOT NULL DEFAULT 1000,
      currency_symbol TEXT NOT NULL DEFAULT '₪',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_deposits_account ON deposits(account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_deposit ON transactions(deposit_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`,
  ];

  for (const sql of SCHEMA_SQL) {
    await db.execute(sql);
  }

  // Seed settings
  await db.execute('INSERT OR IGNORE INTO settings (id) VALUES (1)');

  // Create admin account
  const adminHash = await hash('admin123', 10);
  await db.execute({
    sql: `INSERT OR REPLACE INTO accounts (id, name, password_hash, role, avatar_emoji) VALUES (?, ?, ?, ?, ?)`,
    args: ['admin001', 'אבא', adminHash, 'admin', '👨‍💼'],
  });

  // Create child accounts
  const children = [
    { id: 'child001', name: 'נועה', emoji: '🦊', password: '1234' },
    { id: 'child002', name: 'איתי', emoji: '🦁', password: '1234' },
    { id: 'child003', name: 'מאיה', emoji: '🦋', password: '1234' },
  ];

  for (const child of children) {
    const passwordHash = await hash(child.password, 10);
    await db.execute({
      sql: `INSERT OR REPLACE INTO accounts (id, name, password_hash, role, avatar_emoji) VALUES (?, ?, ?, ?, ?)`,
      args: [child.id, child.name, passwordHash, 'child', child.emoji],
    });
  }

  // Create sample deposits
  const deposits = [
    { id: 'dep001', accountId: 'child001', name: 'חיסכון לאופניים', type: 'flexible', amount: 50000, rate: 300 },
    { id: 'dep002', accountId: 'child001', name: 'חיסכון ליום הולדת', type: 'fixed', amount: 100000, rate: 600, termDays: 365 },
    { id: 'dep003', accountId: 'child002', name: 'חיסכון למשחק חדש', type: 'flexible', amount: 25000, rate: 300 },
    { id: 'dep004', accountId: 'child003', name: 'חיסכון לטיול', type: 'fixed', amount: 75000, rate: 500, termDays: 180 },
  ];

  for (const dep of deposits) {
    const maturityDate = dep.termDays
      ? new Date(Date.now() + dep.termDays * 86400000).toISOString().split('T')[0]
      : null;
    const penaltyPct = dep.type === 'fixed' ? 50 : 0;

    await db.execute({
      sql: `INSERT OR REPLACE INTO deposits (id, account_id, name, type, principal_agorot, balance_agorot, interest_rate_bps, term_days, maturity_date, early_withdrawal_penalty_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [dep.id, dep.accountId, dep.name, dep.type, dep.amount, dep.amount, dep.rate, dep.termDays || null, maturityDate, penaltyPct],
    });

    // Create initial deposit transaction
    await db.execute({
      sql: `INSERT OR REPLACE INTO transactions (id, deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
            VALUES (?, ?, ?, 'deposit', ?, ?, ?)`,
      args: [`tx_${dep.id}`, dep.id, dep.accountId, dep.amount, dep.amount, `הפקדה ראשונית - ${dep.name}`],
    });
  }

  console.log('✅ Seed completed!');
  console.log('');
  console.log('Accounts:');
  console.log('  👨‍💼 אבא (admin) - password: admin123');
  console.log('  🦊 נועה - password: 1234');
  console.log('  🦁 איתי - password: 1234');
  console.log('  🦋 מאיה - password: 1234');
  console.log('');
  console.log('Run: npm run dev');
}

seed().catch(console.error);
