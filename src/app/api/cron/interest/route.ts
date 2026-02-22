import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db-schema';
import { accrueInterest } from '@/lib/interest';
import { daysBetween } from '@/lib/utils';

// POST /api/cron/interest - daily interest accrual
export async function POST(_request: NextRequest) {
  try {
    await initializeDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Get all active deposits that need interest accrual
    const deposits = await db.execute({
      sql: `SELECT * FROM deposits WHERE status = 'active' AND date(interest_last_accrued_at) < date(?)`,
      args: [today],
    });

    let totalAccrued = 0;
    let depositsProcessed = 0;
    let matured = 0;

    console.log(`[cron] today=${today}, active deposits found=${deposits.rows.length}`);
    for (const d of deposits.rows) {
      console.log(`[cron] deposit=${d.id} balance=${d.balance_agorot} last_accrued=${d.interest_last_accrued_at} rate=${d.interest_rate_bps}`);
    }

    for (const deposit of deposits.rows) {
      const days = daysBetween(deposit.interest_last_accrued_at as string, today);
      if (days <= 0) continue;

      const { newBalance, interestEarned } = accrueInterest(
        deposit.balance_agorot as number,
        deposit.interest_rate_bps as number,
        days
      );

      if (interestEarned > 0) {
        // Update deposit balance
        await db.execute({
          sql: `UPDATE deposits SET balance_agorot = ?, interest_last_accrued_at = ?, updated_at = datetime('now') WHERE id = ?`,
          args: [newBalance, today, deposit.id],
        });

        // Create interest transaction
        await db.execute({
          sql: `INSERT INTO transactions (deposit_id, account_id, type, amount_agorot, balance_after_agorot, description)
                VALUES (?, ?, 'interest', ?, ?, ?)`,
          args: [
            deposit.id,
            deposit.account_id,
            interestEarned,
            newBalance,
            `ריבית יומית (${days} ימים)`,
          ],
        });

        totalAccrued += interestEarned;
        depositsProcessed++;
      }

      // Check maturity for fixed deposits
      if (deposit.type === 'fixed' && deposit.maturity_date) {
        if (new Date(deposit.maturity_date as string) <= new Date(today)) {
          await db.execute({
            sql: "UPDATE deposits SET status = 'matured', updated_at = datetime('now') WHERE id = ?",
            args: [deposit.id],
          });
          matured++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      date: today,
      active_deposits_found: deposits.rows.length,
      deposits_processed: depositsProcessed,
      total_interest_agorot: totalAccrued,
      matured,
    });
  } catch (error) {
    console.error('Cron interest error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

// Also allow GET for easy manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
