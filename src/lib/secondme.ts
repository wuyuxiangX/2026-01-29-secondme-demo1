/**
 * SecondMe API 封装
 * 基于 https://secondmeapi.preview.huawei-zeabur.cn/zh/docs/api-reference
 */

const SECONDME_BASE_URL = 'https://app.mindos.com/gate/lab';

// OAuth 配置
export const OAUTH_CONFIG = {
  clientId: process.env.SECONDME_CLIENT_ID!,
  clientSecret: process.env.SECONDME_CLIENT_SECRET!,
  redirectUri: process.env.SECONDME_REDIRECT_URI!,
  scopes: [
    'user.info',
    'user.info.shades',
    'user.info.softmemory',
    'chat',
    'note.add',
  ],
};

// Token 响应类型
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string[];
}

// 用户信息类型
export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

// 用户兴趣标签类型
export interface UserShade {
  id: string;
  name: string;
  description?: string;
}

// API 响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 构造 OAuth 授权 URL
 * 注意：SecondMe 使用 POST 方式发起授权，需要用户登录后调用
 */
export function getAuthorizationParams(state?: string) {
  return {
    clientId: OAUTH_CONFIG.clientId,
    redirectUri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scopes,
    state: state || generateState(),
  };
}

/**
 * 生成随机 state 用于 CSRF 防护
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 用授权码换取 access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const response = await fetch(`${SECONDME_BASE_URL}/api/oauth/token/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
    }),
  });

  const result: ApiResponse<TokenResponse> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to exchange code for token');
  }

  return result.data;
}

/**
 * 刷新 access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`${SECONDME_BASE_URL}/api/oauth/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
    }),
  });

  const result: ApiResponse<TokenResponse> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to refresh token');
  }

  return result.data;
}

/**
 * 获取用户基本信息
 */
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch(`${SECONDME_BASE_URL}/api/secondme/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result: ApiResponse<UserInfo> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to get user info');
  }

  return result.data;
}

/**
 * 获取用户兴趣标签
 */
export async function getUserShades(accessToken: string): Promise<UserShade[]> {
  const response = await fetch(`${SECONDME_BASE_URL}/api/secondme/user/shades`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result: ApiResponse<UserShade[]> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to get user shades');
  }

  return result.data;
}

/**
 * 获取用户软记忆（个人知识库）
 */
export async function getUserSoftMemory(
  accessToken: string,
  options?: { query?: string; page?: number; pageSize?: number }
): Promise<unknown> {
  const params = new URLSearchParams();
  if (options?.query) params.set('query', options.query);
  if (options?.page) params.set('page', options.page.toString());
  if (options?.pageSize) params.set('pageSize', options.pageSize.toString());

  const url = `${SECONDME_BASE_URL}/api/secondme/user/softmemory${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result: ApiResponse<unknown> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to get soft memory');
  }

  return result.data;
}

/**
 * 创建笔记
 */
export async function createNote(
  accessToken: string,
  note: { type: 'text' | 'link'; content: string; title?: string }
): Promise<{ id: string }> {
  const response = await fetch(`${SECONDME_BASE_URL}/api/secondme/note/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });

  const result: ApiResponse<{ id: string }> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to create note');
  }

  return result.data;
}
