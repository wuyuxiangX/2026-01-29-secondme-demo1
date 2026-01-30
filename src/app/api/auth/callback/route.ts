import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/secondme';
import { setSession } from '@/lib/session';
import { cookies } from 'next/headers';

/**
 * Build redirect URL using NEXT_PUBLIC_BASE_URL if available.
 * This ensures correct redirects on Zeabur where request.url may be incorrect.
 */
function buildRedirectUrl(path: string, fallbackUrl: string): URL {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || fallbackUrl;
  return new URL(path, baseUrl);
}

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
  // Debug logging for OAuth callback troubleshooting
  console.log('[OAuth Callback] Full request URL:', request.url);
  console.log('[OAuth Callback] Host header:', request.headers.get('host'));
  console.log('[OAuth Callback] X-Forwarded-Host:', request.headers.get('x-forwarded-host'));
  console.log('[OAuth Callback] X-Forwarded-Proto:', request.headers.get('x-forwarded-proto'));
  console.log('[OAuth Callback] Origin:', request.headers.get('origin'));
  console.log('[OAuth Callback] NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || '(not set)');
  console.log('[OAuth Callback] Query params:', Object.fromEntries(request.nextUrl.searchParams));

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 处理授权错误
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Authorization failed';
    const redirectUrl = buildRedirectUrl(`/?error=${encodeURIComponent(errorDescription)}`, request.url);
    console.log('[OAuth Callback] Error redirect to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // 验证必要参数
  if (!code) {
    const redirectUrl = buildRedirectUrl('/?error=Missing authorization code', request.url);
    console.log('[OAuth Callback] Missing code redirect to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // 验证 state（CSRF 防护）
  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;

  if (state && savedState && state !== savedState) {
    const redirectUrl = buildRedirectUrl('/?error=Invalid state parameter', request.url);
    console.log('[OAuth Callback] Invalid state redirect to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // 清除 state cookie
  cookieStore.delete('oauth_state');

  try {
    // 用授权码换取 token
    const tokenData = await exchangeCodeForToken(code);

    // 存储 session
    await setSession(tokenData);

    // 重定向到 dashboard
    const redirectUrl = buildRedirectUrl('/dashboard', request.url);
    console.log('[OAuth Callback] Success redirect to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const message = error instanceof Error ? error.message : 'Authentication failed';
    const redirectUrl = buildRedirectUrl(`/?error=${encodeURIComponent(message)}`, request.url);
    console.log('[OAuth Callback] Exception redirect to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }
}
