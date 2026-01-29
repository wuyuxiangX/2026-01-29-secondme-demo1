/**
 * 代理支持的 Fetch 封装
 * 自动检测代理环境变量并使用
 */

import { ProxyAgent, fetch as undiciFetch } from 'undici';

// 获取代理 URL
function getProxyUrl(): string | undefined {
  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
}

// 创建代理 Agent（如果配置了代理）
let proxyAgent: ProxyAgent | undefined;

function getProxyAgent(): ProxyAgent | undefined {
  const proxyUrl = getProxyUrl();

  if (!proxyUrl) {
    return undefined;
  }

  if (!proxyAgent) {
    proxyAgent = new ProxyAgent(proxyUrl);
    console.log(`[ProxyFetch] Using proxy: ${proxyUrl}`);
  }

  return proxyAgent;
}

/**
 * 支持代理的 fetch 函数
 * 当配置了代理环境变量时，自动使用代理
 */
export async function proxyFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const agent = getProxyAgent();

  if (agent) {
    // 使用 undici 的 fetch 配合代理
    const response = await undiciFetch(url.toString(), {
      ...init,
      dispatcher: agent,
    } as Parameters<typeof undiciFetch>[1]);

    // 转换为标准 Response
    return response as unknown as Response;
  }

  // 没有代理配置，使用原生 fetch
  return fetch(url, init);
}

export default proxyFetch;
