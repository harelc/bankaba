import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db-schema';
import { requireAdmin, hashPassword, getSession } from '@/lib/auth';
import { projectBalance } from '@/lib/interest';
import { z } from 'zod/v4';

// GET /api/accounts - list all accounts (public for login page avatars, filtered for non-admin)
export async function GET() {
  try {
    await initializeDatabase();
    const session = await getSession();

    // For login page (no session): return just names and avatars
    if (!session) {
      const result = await db.execute(
        'SELECT id, name, avatar_emoji, role FROM accounts ORDER BY role DESC, name ASC'
      );
      return NextResponse.json(result.rows);
    }

    // For admin: return full account details with projected balances
    if (session.role === 'admin') {
      const accountsResult = await db.execute(
        'SELECT id, name, role, avatar_emoji, created_at FROM accounts ORDER BY role DESC, name ASC'
      );
      const depositsResult = await db.execute(
        "SELECT account_id, balance_agorot, interest_rate_bps, interest_last_accrued_at FROM deposits WHERE status = 'active'"
      );

      const accountsMap = new Map<string, { total: number; count: number }>();
      for (const d of depositsResult.rows) {
        const accountId = d.account_id as string;
        const projected = projectBalance(
          Number(d.balance_agorot),
          Number(d.interest_rate_bps),
          d.interest_last_accrued_at as string
        );
        const entry = accountsMap.get(accountId) || { total: 0, count: 0 };
        entry.total += projected;
        entry.count += 1;
        accountsMap.set(accountId, entry);
      }

      const rows = accountsResult.rows.map((a) => {
        const entry = accountsMap.get(a.id as string) || { total: 0, count: 0 };
        return {
          ...a,
          total_balance_agorot: entry.total,
          deposit_count: entry.count,
        };
      });

      return NextResponse.json(rows);
    }

    // For children: return basic account list (same as no session)
    const result = await db.execute(
      'SELECT id, name, avatar_emoji, role FROM accounts ORDER BY role DESC, name ASC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

const createAccountSchema = z.object({
  name: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
  role: z.enum(['child', 'admin']).default('child'),
  avatar_emoji: z.string().default('🐷'),
});

// POST /api/accounts - create account (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await initializeDatabase();

    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { name, password, role, avatar_emoji } = parsed.data;
    const password_hash = await hashPassword(password);

    const result = await db.execute({
      sql: `INSERT INTO accounts (name, password_hash, role, avatar_emoji)
            VALUES (?, ?, ?, ?)
            RETURNING id, name, role, avatar_emoji, created_at`,
      args: [name, password_hash, role, avatar_emoji],
    });

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create account error:', error);
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
