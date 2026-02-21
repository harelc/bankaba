import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db-schema';
import { requireAuth } from '@/lib/auth';
import { projectBalance } from '@/lib/interest';
import { z } from 'zod/v4';

// GET /api/deposits - list deposits for current user (or all for admin)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let sql: string;
    let args: string[];

    if (session.role === 'admin' && accountId) {
      sql = 'SELECT * FROM deposits WHERE account_id = ? ORDER BY created_at DESC';
      args = [accountId];
    } else if (session.role === 'admin') {
      sql = `SELECT d.*, a.name as account_name, a.avatar_emoji
             FROM deposits d JOIN accounts a ON d.account_id = a.id
             ORDER BY d.created_at DESC`;
      args = [];
    } else {
      sql = 'SELECT * FROM deposits WHERE account_id = ? ORDER BY created_at DESC';
      args = [session.accountId];
    }

    const result = await db.execute({ sql, args });

    // Add projected balances for active deposits
    const deposits = result.rows.map((row) => {
      if (row.status === 'active') {
        return {
          ...row,
          projected_balance_agorot: projectBalance(
            row.balance_agorot as number,
            row.interest_rate_bps as number,
            row.interest_last_accrued_at as string
          ),
        };
      }
      return row;
    });

    return NextResponse.json(deposits);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }
    console.error('Get deposits error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

const createDepositSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['flexible', 'fixed']),
  amount_agorot: z.number().int().positive(),
  interest_rate_bps: z.number().int().positive().optional(),
  term_days: z.number().int().positive().optional(),
  account_id: z.string().optional(), // admin can create for any account
});

// POST /api/deposits - create deposit
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const session = await requireAuth();

    const body = await request.json();
    const parsed = createDepositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const data = parsed.data;
    const targetAccountId = session.role === 'admin' && data.account_id
      ? data.account_id
      : session.accountId;

    // Get default settings
    const settingsResult = await db.execute('SELECT * FROM settings WHERE id = 1');
    const settings = settingsResult.rows[0];

    if (data.amount_agorot < (settings?.min_deposit_agorot as number || 1000)) {
      return NextResponse.json({ error: 'סכום ההפקדה נמוך מדי' }, { status: 400 });
    }

    const interestRateBps = data.interest_rate_bps ||
      (data.type === 'fixed'
        ? (settings?.default_fixed_rate_bps as number || 600)
        : (settings?.default_flexible_rate_bps as number || 300));

    const termDays = data.type === 'fixed' ? (data.term_days || 365) : null;
    const maturityDate = termDays
      ? new Date(Date.now() + termDays * 86400000).toISOString().split('T')[0]
      : null;
    const penaltyPct = data.type === 'fixed' ? (settings?.default_penalty_pct as number || 50) : 0;

    const result = await db.execute({
      sql: `INSERT INTO deposits (account_id, name, type, principal_agorot, balance_agorot,
              interest_rate_bps, term_days, maturity_date, early_withdrawal_penalty_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [targetAccountId, data.name, data.type, data.amount_agorot, data.amount_agorot,
        interestRateBps, termDays, maturityDate, penaltyPct],
    });

    const deposit = result.rows[0];

    // Create initial deposit transaction
    await db.execute({
      sql: `INSERT INTO transactions (deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
            VALUES (?, ?, 'deposit', ?, ?, ?)`,
      args: [deposit.id, targetAccountId, data.amount_agorot, data.amount_agorot, `הפקדה ראשונית - ${data.name}`],
    });

    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }
    console.error('Create deposit error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
