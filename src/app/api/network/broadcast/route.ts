/**
 * 广播任务 API
 * POST /api/network/broadcast - 发布任务并和网络中的用户对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastRequest } from '@/lib/agents';
import { getAccessToken, getSession } from '@/lib/session';
import { getUserInfo } from '@/lib/secondme';

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const session = await getSession();

    if (!accessToken || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.email;

    if (!secondmeId) {
      return NextResponse.json({ error: '无法获取用户信息' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: '需求内容不能为空' }, { status: 400 });
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

    // 创建需求记录（使用 User.id）
    const requestRecord = await prisma.request.create({
      data: {
        userId: user.id,
        content,
        status: 'pending',
      },
    });

    console.log(`[API] Broadcasting request ${requestRecord.id} from user ${user.id}`);

    // 广播给网络中的用户（传入 user.id 用于排除自己）
    const results = await broadcastRequest(requestRecord.id, content, user.id);

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      data: {
        requestId: requestRecord.id,
        totalUsers: results.length,
        successCount,
        failedCount,
        conversations: results.filter((r) => r.status === 'success').map((r) => ({
          conversationId: r.conversationId,
          userName: r.targetUserName,
          firstReply: r.firstReply,
        })),
      },
    });
  } catch (error) {
    console.error('[API] Broadcast failed:', error);
    return NextResponse.json(
      { error: '广播失败', details: String(error) },
      { status: 500 }
    );
  }
}
