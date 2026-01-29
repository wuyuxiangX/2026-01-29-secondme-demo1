/**
 * Session 管理 - 使用 HTTP-only cookies 存储 token
 */

import { cookies } from 'next/headers';
import { TokenResponse } from './secondme';

const TOKEN_COOKIE_NAME = 'secondme_token';
const REFRESH_TOKEN_COOKIE_NAME = 'secondme_refresh_token';

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  openId?: string;
}

/**
 * 设置 session（存储 token 到 cookies）
 */
export async function setSession(tokenData: TokenResponse): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + tokenData.expiresIn * 1000;

  // 存储 access token (HTTP-only, secure in production)
  cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify({
    accessToken: tokenData.accessToken,
    expiresAt,
    openId: tokenData.openId,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokenData.expiresIn,
    path: '/',
  });

  // 存储 refresh token (更长有效期)
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, tokenData.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 天
    path: '/',
  });
}

/**
 * 获取当前 session
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();

  const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
  const refreshTokenCookie = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME);

  if (!tokenCookie?.value) {
    return null;
  }

  try {
    const { accessToken, expiresAt, openId } = JSON.parse(tokenCookie.value);
    return {
      accessToken,
      refreshToken: refreshTokenCookie?.value || '',
      expiresAt,
      openId,
    };
  } catch {
    return null;
  }
}

/**
 * 获取 access token（如果过期则返回 null）
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // 检查是否过期（提前 5 分钟刷新）
  if (Date.now() > session.expiresAt - 5 * 60 * 1000) {
    return null; // 需要刷新
  }

  return session.accessToken;
}

/**
 * 获取 refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value || null;
}

/**
 * 清除 session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

/**
 * 检查用户是否已登录
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}
