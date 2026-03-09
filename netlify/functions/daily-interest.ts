import { createClient } from "@libsql/client";
import type { Config } from "@netlify/functions";

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA.split("T")[0].split(" ")[0] + "T00:00:00Z");
  const b = new Date(dateB.split("T")[0].split(" ")[0] + "T00:00:00Z");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function accrueInterest(
  balanceAgorot: number,
  annualRateBps: number,
  days: number
): { newBalance: number; interestEarned: number } {
  const dailyRate = annualRateBps / 10000 / 365;
  let balance = balanceAgorot;
  for (let i = 0; i < days; i++) {
    balance += Math.round(balance * dailyRate);
  }
  return { newBalance: balance, interestEarned: balance - balanceAgorot };
}

export default async () => {
  const startTime = Date.now();
  console.log(`[daily-interest] Starting at ${new Date().toISOString()}`);

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("[daily-interest] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    return new Response(JSON.stringify({ error: "Missing DB credentials" }), { status: 500 });
  }

  const db = createClient({ url, authToken });

  try {
    const today = new Date().toISOString().split("T")[0];

    const deposits = await db.execute({
      sql: `SELECT * FROM deposits WHERE status = 'active' AND date(interest_last_accrued_at) < date(?)`,
      args: [today],
    });

    let totalAccrued = 0;
    let depositsProcessed = 0;
    let matured = 0;

    console.log(`[daily-interest] today=${today}, active deposits found=${deposits.rows.length}`);

    for (const deposit of deposits.rows) {
      const days = daysBetween(deposit.interest_last_accrued_at as string, today);
      if (days <= 0) continue;

      const { newBalance, interestEarned } = accrueInterest(
        deposit.balance_agorot as number,
        deposit.interest_rate_bps as number,
        days
      );

      if (interestEarned > 0) {
        await db.execute({
          sql: `UPDATE deposits SET balance_agorot = ?, interest_last_accrued_at = ?, updated_at = datetime('now') WHERE id = ?`,
          args: [newBalance, today, deposit.id],
        });

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

      if (deposit.type === "fixed" && deposit.maturity_date) {
        if (new Date(deposit.maturity_date as string) <= new Date(today)) {
          await db.execute({
            sql: "UPDATE deposits SET status = 'matured', updated_at = datetime('now') WHERE id = ?",
            args: [deposit.id],
          });
          matured++;
        }
      }
    }

    const result = {
      ok: true,
      date: today,
      active_deposits_found: deposits.rows.length,
      deposits_processed: depositsProcessed,
      total_interest_agorot: totalAccrued,
      matured,
    };

    const duration = Date.now() - startTime;
    console.log(`[daily-interest] Result: ${JSON.stringify(result)}`);
    console.log(`[daily-interest] Completed in ${duration}ms`);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[daily-interest] FAILED after ${duration}ms:`, error);
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 2 * * *", // Daily at 2am UTC
};
