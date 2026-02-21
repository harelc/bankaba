import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db-schema';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod/v4';

// GET /api/admin/settings - readable by any authenticated user
export async function GET() {
  try {
    await initializeDatabase();
    const result = await db.execute('SELECT * FROM settings WHERE id = 1');
    return NextResponse.json(result.rows[0] || {});
  } catch (error) {
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}

const settingsSchema = z.object({
  default_flexible_rate_bps: z.number().int().min(0).max(10000).optional(),
  default_fixed_rate_bps: z.number().int().min(0).max(10000).optional(),
  default_penalty_pct: z.number().int().min(0).max(100).optional(),
  min_deposit_agorot: z.number().int().positive().optional(),
});

// PUT /api/admin/settings
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const updates: string[] = [];
    const args: (string | number)[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        args.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'אין שינויים' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");

    await db.execute({
      sql: `UPDATE settings SET ${updates.join(', ')} WHERE id = 1`,
      args,
    });

    const result = await db.execute('SELECT * FROM settings WHERE id = 1');
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Forbidden' || error.message === 'Unauthorized')) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
