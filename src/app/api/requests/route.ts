import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getSession } from '@/lib/session';
import { getUserInfo } from '@/lib/secondme';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const session = await getSession();

    if (!accessToken || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, budget, deadline } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.email;

    if (!secondmeId) {
      return NextResponse.json(
        { error: 'Unable to get user email' },
        { status: 400 }
      );
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
    const newRequest = await prisma.request.create({
      data: {
        userId: user.id,
        content,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: newRequest.id,
        content: newRequest.content,
        budget: newRequest.budget,
        deadline: newRequest.deadline,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Request creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取用户的需求列表
export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const session = await getSession();

    if (!accessToken || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.email;

    if (!secondmeId) {
      return NextResponse.json(
        { error: 'Unable to get user email' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { secondmeId },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            conversations: {
              include: {
                targetUser: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ requests: [] });
    }

    // 格式化返回数据
    const requests = user.requests.map((req) => ({
      id: req.id,
      content: req.content,
      budget: req.budget,
      deadline: req.deadline,
      summary: req.summary,
      status: req.status,
      createdAt: req.createdAt,
      conversations: req.conversations.map((conv) => ({
        id: conv.id,
        targetUser: conv.targetUser,
        messages: JSON.parse(conv.messages),
        summary: conv.summary,
        status: conv.status,
        createdAt: conv.createdAt,
      })),
      conversationCount: req.conversations.length,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
