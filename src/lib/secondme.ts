/**
 * SecondMe API 封装
 * 基于 https://secondmeapi.preview.huawei-zeabur.cn/zh/docs/api-reference
 */

const SECONDME_BASE_URL = 'https://app.mindos.com/gate/lab';

// OAuth 授权 URL (使用通用链接)
const OAUTH_AUTHORIZE_URL = 'https://go.second.me/oauth/';

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
  openId?: string;
}

// 用户信息类型
export interface UserInfo {
  id?: string;
  openId?: string;
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
 * 生成随机 state 用于 CSRF 防护
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 构造 OAuth 授权 URL (使用标准重定向流程)
 * 用户点击后重定向到此 URL，在 SecondMe 上登录并授权
 */
export function buildAuthorizationUrl(state: string): string {
  const url = new URL(OAUTH_AUTHORIZE_URL);

  url.searchParams.append('client_id', OAUTH_CONFIG.clientId);
  url.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('state', state);

  // 添加 scope (作为空格分隔的字符串)
  url.searchParams.append('scope', OAUTH_CONFIG.scopes.join(' '));

  return url.toString();
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
