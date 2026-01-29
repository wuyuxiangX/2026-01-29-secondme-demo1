import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/secondme';
import { setSession } from '@/lib/session';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/callback
 *
 * OAuth 回调处理：
 * 1. 接收 code 和 state 参数
 * 2. 验证 state 防止 CSRF
 * 3. 用 code 换取 access token
 * 4. 将 token 存入 session
 * 5. 重定向到 dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 处理授权错误
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Authorization failed';
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  // 验证必要参数
  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=Missing authorization code', request.url)
    );
  }

  // 验证 state（CSRF 防护）
  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;

  if (state && savedState && state !== savedState) {
    return NextResponse.redirect(
      new URL('/?error=Invalid state parameter', request.url)
    );
  }

  // 清除 state cookie
  cookieStore.delete('oauth_state');

  try {
    // 用授权码换取 token
    const tokenData = await exchangeCodeForToken(code);

    // 存储 session
    await setSession(tokenData);

    // 重定向到 dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
