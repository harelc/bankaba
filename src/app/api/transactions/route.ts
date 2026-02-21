import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');
    const accountId = searchParams.get('accountId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let sql: string;
    let args: (string | number)[];

    if (depositId) {
      // Check ownership
      if (session.role !== 'admin') {
        const dep = (await db.execute({
          sql: 'SELECT account_id FROM deposits WHERE id = ?',
          args: [depositId],
        })).rows[0];
        if (!dep || dep.account_id !== session.accountId) {
          return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
        }
      }
      sql = `SELECT t.*, d.name as deposit_name
             FROM transactions t
             JOIN deposits d ON t.deposit_id = d.id
             WHERE t.deposit_id = ?
             ORDER BY t.created_at DESC LIMIT ?`;
      args = [depositId, limit];
    } else if (session.role === 'admin' && accountId) {
      sql = `SELECT t.*, d.name as deposit_name
             FROM transactions t
             JOIN deposits d ON t.deposit_id = d.id
             WHERE t.account_id = ?
             ORDER BY t.created_at DESC LIMIT ?`;
      args = [accountId, limit];
    } else if (session.role === 'admin') {
      sql = `SELECT t.*, d.name as deposit_name, a.name as account_name
             FROM transactions t
             JOIN deposits d ON t.deposit_id = d.id
             JOIN accounts a ON t.account_id = a.id
             ORDER BY t.created_at DESC LIMIT ?`;
      args = [limit];
    } else {
      sql = `SELECT t.*, d.name as deposit_name
             FROM transactions t
             JOIN deposits d ON t.deposit_id = d.id
             WHERE t.account_id = ?
             ORDER BY t.created_at DESC LIMIT ?`;
      args = [session.accountId, limit];
    }

    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
