import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db-schema';
import { verifyPassword, createToken, COOKIE_NAME } from '@/lib/auth';
import { z } from 'zod/v4';

const loginSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { accountId, password } = parsed.data;
    const result = await db.execute({
      sql: 'SELECT id, name, password_hash, role, avatar_emoji FROM accounts WHERE id = ?',
      args: [accountId],
    });

    const account = result.rows[0];
    if (!account) {
      return NextResponse.json({ error: 'חשבון לא נמצא' }, { status: 404 });
    }

    const valid = await verifyPassword(password, account.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 });
    }

    const token = await createToken({
      accountId: account.id as string,
      name: account.name as string,
      role: account.role as 'child' | 'admin',
      avatarEmoji: account.avatar_emoji as string,
    });

    const response = NextResponse.json({
      account: {
        id: account.id,
        name: account.name,
        role: account.role,
        avatar_emoji: account.avatar_emoji,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
}
