import { NextResponse } from 'next/server';
import { OAUTH_CONFIG, generateState } from '@/lib/secondme';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/login
 *
 * 由于 SecondMe OAuth 使用 POST 方式发起授权请求，
 * 我们需要先让用户登录 SecondMe，然后在客户端调用授权 API。
 *
 * 这个接口返回授权所需的参数，让前端发起授权请求。
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

  // 返回授权参数，让前端发起授权请求
  return NextResponse.json({
    clientId: OAUTH_CONFIG.clientId,
    redirectUri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scopes,
    state,
    // SecondMe 授权页面 URL（需要用户已登录）
    authorizeUrl: 'https://app.mindos.com/gate/lab/api/oauth/authorize/external',
  });
}
