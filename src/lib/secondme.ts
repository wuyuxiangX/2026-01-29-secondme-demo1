/**
 * SecondMe API 封装
 * 基于 https://secondmeapi.preview.huawei-zeabur.cn/zh/docs/api-reference
 */

import proxyFetch from './proxyFetch';

const SECONDME_BASE_URL = 'https://app.mindos.com/gate/lab';

// 使用支持代理的 fetch
const apiFetch = proxyFetch;

// OAuth 授权 URL (使用通用链接)
const OAUTH_AUTHORIZE_URL = 'https://go.second.me/oauth/';

// OAuth 配置 - 运行时获取，避免模块加载时环境变量未就绪
function getOAuthConfig() {
  return {
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
}

// 保持向后兼容的导出
export const OAUTH_CONFIG = {
  get clientId() { return getOAuthConfig().clientId; },
  get clientSecret() { return getOAuthConfig().clientSecret; },
  get redirectUri() { return getOAuthConfig().redirectUri; },
  get scopes() { return getOAuthConfig().scopes; },
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
  email: string;
  avatar?: string;
  bio?: string;
  selfIntroduction?: string;
  voiceId?: string;
  profileCompleteness?: number;
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
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/oauth/token/code`, {
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
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/oauth/token/refresh`, {
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
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/secondme/user/info`, {
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
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/secondme/user/shades`, {
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

  const response = await apiFetch(url, {
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
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/secondme/note/add`, {
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

// 聊天相关类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  senderId?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  lastMessage?: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatStreamOptions {
  message: string;
  sessionId?: string;
  systemPrompt?: string;
  appId?: string;
}

/**
 * 流式聊天 - 返回 ReadableStream
 * 客户端可以使用此流进行实时显示
 */
export async function chatStream(
  accessToken: string,
  options: ChatStreamOptions
): Promise<Response> {
  const response = await apiFetch(`${SECONDME_BASE_URL}/api/secondme/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`Chat stream failed: ${response.status}`);
  }

  return response;
}

/**
 * 非流式聊天 - 等待完整响应
 * 用于后端分析场景
 */
export async function chat(
  accessToken: string,
  options: ChatStreamOptions
): Promise<{ sessionId: string; content: string }> {
  const response = await chatStream(accessToken, options);
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let content = '';
  let sessionId = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('event: session')) {
        // 下一行是 session data
        continue;
      }
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          break;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.sessionId) {
            sessionId = parsed.sessionId;
          }
          // 处理 OpenAI 兼容格式: choices[0].delta.content
          if (parsed.choices?.[0]?.delta?.content) {
            content += parsed.choices[0].delta.content;
          }
          // 处理其他可能的格式
          else if (parsed.content) {
            content += parsed.content;
          }
          else if (parsed.delta) {
            content += parsed.delta;
          }
        } catch {
          // 可能是纯文本增量
          if (data && data !== '[DONE]') {
            content += data;
          }
        }
      }
    }
  }

  return { sessionId, content };
}

/**
 * 获取会话列表
 */
export async function getChatSessions(
  accessToken: string,
  appId?: string
): Promise<ChatSession[]> {
  const params = new URLSearchParams();
  if (appId) params.set('appId', appId);

  const url = `${SECONDME_BASE_URL}/api/secondme/chat/session/list${params.toString() ? `?${params}` : ''}`;

  const response = await apiFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result: ApiResponse<ChatSession[]> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to get chat sessions');
  }

  return result.data;
}

/**
 * 获取会话消息历史
 */
export async function getChatMessages(
  accessToken: string,
  sessionId: string
): Promise<ChatMessage[]> {
  const response = await apiFetch(
    `${SECONDME_BASE_URL}/api/secondme/chat/session/messages?sessionId=${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result: ApiResponse<ChatMessage[]> = await response.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Failed to get chat messages');
  }

  return result.data;
}
