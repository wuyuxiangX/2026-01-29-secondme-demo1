import { NextResponse } from 'next/server';
import { buildAuthorizationUrl, generateState } from '@/lib/secondme';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/login
 *
 * 发起 OAuth2 授权流程：
 * 1. 生成 state 用于 CSRF 防护
 * 2. 存储 state 到 cookie
 * 3. 重定向用户到 SecondMe 授权页面
 */
export async function GET() {
  const state = generateState();

  // 将 state 存储到 cookie 用于后续验证
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5, // 5 分钟有效
    path: '/',
  });

  // 构建授权 URL 并重定向
  const authorizationUrl = buildAuthorizationUrl(state);

  return NextResponse.redirect(authorizationUrl);
}
