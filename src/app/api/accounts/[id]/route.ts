import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { z } from 'zod/v4';

// GET /api/accounts/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT a.id, a.name, a.role, a.avatar_emoji, a.created_at,
              COALESCE(SUM(d.balance_agorot), 0) as total_balance_agorot,
              COUNT(d.id) as deposit_count
            FROM accounts a
            LEFT JOIN deposits d ON d.account_id = a.id AND d.status = 'active'
            WHERE a.id = ?
            GROUP BY a.id`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'חשבון לא נמצא' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  password: z.string().min(1).max(100).optional(),
  avatar_emoji: z.string().optional(),
});

// PATCH /api/accounts/[id]
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

    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (parsed.data.name) {
      updates.push('name = ?');
      args.push(parsed.data.name);
    }
    if (parsed.data.password) {
      updates.push('password_hash = ?');
      args.push(await hashPassword(parsed.data.password));
    }
    if (parsed.data.avatar_emoji) {
      updates.push('avatar_emoji = ?');
      args.push(parsed.data.avatar_emoji);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'אין שינויים' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    args.push(id);

    await db.execute({
      sql: `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
