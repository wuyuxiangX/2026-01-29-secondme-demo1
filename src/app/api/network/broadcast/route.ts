/**
 * 广播任务 API（SSE 流式版本）
 * POST /api/network/broadcast - 发布任务并和网络中的用户对话，实时推送消息
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastRequestWithStream, SSEEvent } from '@/lib/agents';
import { getAccessToken, getSession, getRefreshToken, setSession } from '@/lib/session';
import { getUserInfo, refreshAccessToken } from '@/lib/secondme';

export async function POST(request: NextRequest) {
  try {
    let accessToken = await getAccessToken();
    let session = await getSession();

    // 如果 token 过期，尝试刷新
    if (!accessToken) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const newTokenData = await refreshAccessToken(refreshToken);
          await setSession(newTokenData);
          accessToken = newTokenData.accessToken;
          session = await getSession();
        } catch (error) {
          console.error('[API] Token refresh failed:', error);
          return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: '请先登录' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (!session) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.email;

    if (!secondmeId) {
      return new Response(JSON.stringify({ error: '无法获取用户信息' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return new Response(JSON.stringify({ error: '需求内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { secondmeId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          secondmeId,
          name: userInfo.name,
          avatar: userInfo.avatar,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          tokenExpiry: new Date(session.expiresAt),
        },
      });
    }

    // 创建需求记录
    const requestRecord = await prisma.request.create({
      data: {
        userId: user.id,
        content,
        status: 'pending',
      },
    });

    console.log(`[API] Broadcasting request ${requestRecord.id} from user ${user.id} (SSE)`);

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // SSE 写入器
    const sseWriter = {
      write: async (event: SSEEvent) => {
        const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        await writer.write(encoder.encode(data));
      },
      close: () => {
        writer.close();
      },
    };

    // 在后台执行广播（不阻塞响应）
    broadcastRequestWithStream(requestRecord.id, content, user.id, sseWriter).catch((error) => {
      console.error('[API] Broadcast stream failed:', error);
      sseWriter.write({
        event: 'error',
        data: { error: String(error) },
      }).finally(() => sseWriter.close());
    });

    // 返回 SSE 响应
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Broadcast failed:', error);
    return new Response(JSON.stringify({ error: '广播失败', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
