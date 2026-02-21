import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { calculatePenalty, projectBalance } from '@/lib/interest';

// POST /api/deposits/[id]/withdraw
export async function POST(
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

    // Check ownership (admin can also withdraw)
    if (session.role !== 'admin' && deposit.account_id !== session.accountId) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    if (deposit.status !== 'active') {
      return NextResponse.json({ error: 'החיסכון כבר נפדה' }, { status: 400 });
    }

    // Project current balance including unaccrued interest
    const currentBalance = projectBalance(
      deposit.balance_agorot as number,
      deposit.interest_rate_bps as number,
      deposit.interest_last_accrued_at as string
    );

    let penaltyAmount = 0;
    let netAmount = currentBalance;

    // Fixed deposit with early withdrawal: apply penalty
    const isFixed = deposit.type === 'fixed';
    const isEarly = isFixed && deposit.maturity_date && new Date(deposit.maturity_date as string) > new Date();

    if (isEarly) {
      const penalty = calculatePenalty(
        deposit.principal_agorot as number,
        currentBalance,
        deposit.early_withdrawal_penalty_pct as number
      );
      penaltyAmount = penalty.penaltyAmount;
      netAmount = penalty.netAmount;
    }

    // Update deposit status
    await db.execute({
      sql: "UPDATE deposits SET status = 'withdrawn', balance_agorot = 0, updated_at = datetime('now') WHERE id = ?",
      args: [id],
    });

    // Create penalty transaction if applicable
    if (penaltyAmount > 0) {
      await db.execute({
        sql: `INSERT INTO transactions (deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
              VALUES (?, ?, 'penalty', ?, ?, ?)`,
        args: [id, deposit.account_id, -penaltyAmount, currentBalance - penaltyAmount, `קנס משיכה מוקדמת (${deposit.early_withdrawal_penalty_pct}% מהריבית)`],
      });
    }

    // Create withdrawal transaction
    await db.execute({
      sql: `INSERT INTO transactions (deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
            VALUES (?, ?, 'withdrawal', ?, 0, ?)`,
      args: [id, deposit.account_id, -netAmount, `משיכה מ${deposit.name}`],
    });

    return NextResponse.json({
      withdrawn: netAmount,
      penalty: penaltyAmount,
      was_early: isEarly,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
