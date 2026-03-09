import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { projectBalance } from '@/lib/interest';
import { z } from 'zod/v4';

// GET /api/deposits/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const result = await db.execute({
      sql: 'SELECT * FROM deposits WHERE id = ?',
      args: [id],
    });

    const deposit = result.rows[0];
    if (!deposit) {
      return NextResponse.json({ error: 'חיסכון לא נמצא' }, { status: 404 });
    }

    // Check ownership
    if (session.role !== 'admin' && deposit.account_id !== session.accountId) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    // Add projected balance
    const projected = deposit.status === 'active'
      ? projectBalance(
          deposit.balance_agorot as number,
          deposit.interest_rate_bps as number,
          deposit.interest_last_accrued_at as string
        )
      : deposit.balance_agorot;

    return NextResponse.json({
      ...deposit,
      projected_balance_agorot: projected,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

const updateSchema = z.object({
  interest_rate_bps: z.number().int().positive().optional(),
  balance_adjustment_agorot: z.number().int().optional(),
  description: z.string().optional(),
});

// PATCH /api/deposits/[id] - admin override
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const deposit = (await db.execute({ sql: 'SELECT * FROM deposits WHERE id = ?', args: [id] })).rows[0];
    if (!deposit) {
      return NextResponse.json({ error: 'חיסכון לא נמצא' }, { status: 404 });
    }

    if (parsed.data.interest_rate_bps) {
      await db.execute({
        sql: "UPDATE deposits SET interest_rate_bps = ?, updated_at = datetime('now') WHERE id = ?",
        args: [parsed.data.interest_rate_bps, id],
      });
    }

    if (parsed.data.balance_adjustment_agorot) {
      const adj = parsed.data.balance_adjustment_agorot;
      const newBalance = (deposit.balance_agorot as number) + adj;
      await db.execute({
        sql: "UPDATE deposits SET balance_agorot = ?, updated_at = datetime('now') WHERE id = ?",
        args: [newBalance, id],
      });
      await db.execute({
        sql: `INSERT INTO transactions (deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
              VALUES (?, ?, 'admin_adjustment', ?, ?, ?)`,
        args: [id, deposit.account_id, adj, newBalance, parsed.data.description || 'התאמת מנהל'],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

// DELETE /api/deposits/[id] - admin only, cascades transactions
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const deposit = (await db.execute({ sql: 'SELECT * FROM deposits WHERE id = ?', args: [id] })).rows[0];
    if (!deposit) {
      return NextResponse.json({ error: 'חיסכון לא נמצא' }, { status: 404 });
    }

    await db.execute({ sql: 'DELETE FROM transactions WHERE deposit_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM deposits WHERE id = ?', args: [id] });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
