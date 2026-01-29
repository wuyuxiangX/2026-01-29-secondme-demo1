import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

/**
 * POST /api/auth/logout
 *
 * 登出：清除 session cookies
 */
export async function POST() {
  await clearSession();

  return NextResponse.json({ success: true });
}

/**
 * GET /api/auth/logout
 *
 * 登出并重定向到首页
 */
export async function GET(request: Request) {
  await clearSession();

  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
