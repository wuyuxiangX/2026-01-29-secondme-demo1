import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getSession } from '@/lib/session';
import { getUserInfo } from '@/lib/secondme';
import { prisma } from '@/lib/db';

// 创建新 Offer
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
    const { requestId, content, resource } = body;

    if (!requestId || !content) {
      return NextResponse.json(
        { error: 'requestId and content are required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    // 使用 email 作为用户唯一标识符
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

    // 检查需求是否存在
    const targetRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!targetRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // 不能为自己的需求发布 Offer
    if (targetRequest.user.secondmeId === secondmeId) {
      return NextResponse.json(
        { error: 'Cannot create offer for your own request' },
        { status: 400 }
      );
    }

    // 创建 Offer
    const offer = await prisma.offer.create({
      data: {
        requestId,
        userId: user.id,
        content,
        resource: resource ? JSON.stringify(resource) : null,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // 触发 Agent 评估（异步，不阻塞响应）
    triggerAgentEvaluation(offer.id, targetRequest, offer).catch(console.error);

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        content: offer.content,
        resource: resource || null,
        status: offer.status,
        user: offer.user,
        createdAt: offer.createdAt,
      },
    });
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取当前用户发布的所有 Offers
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

    const userInfo = await getUserInfo(accessToken);
    // 使用 email 作为用户唯一标识符
    const secondmeId = userInfo.email;

    if (!secondmeId) {
      return NextResponse.json(
        { error: 'Unable to get user email' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { secondmeId },
      include: {
        offers: {
          include: {
            request: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ offers: [] });
    }

    const offers = user.offers.map((offer) => ({
      id: offer.id,
      content: offer.content,
      reasoning: offer.reasoning,
      resource: offer.resource ? JSON.parse(offer.resource) : null,
      status: offer.status,
      createdAt: offer.createdAt,
      request: {
        id: offer.request.id,
        content: offer.request.content,
        user: offer.request.user,
      },
    }));

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 异步触发 Agent 评估
async function triggerAgentEvaluation(
  offerId: string,
  request: { id: string; content: string; budget: number | null; analysis: string | null; user: { accessToken: string } },
  offer: { content: string; resource: string | null }
) {
  try {
    // 使用需求发布者的 token 调用 Agent 评估
    const { evaluateOffer } = await import('@/lib/agent');

    const result = await evaluateOffer(
      request.user.accessToken,
      {
        content: request.content,
        budget: request.budget ?? undefined,
        analysis: request.analysis ? JSON.parse(request.analysis) : undefined,
      },
      {
        content: offer.content,
        resource: offer.resource ? JSON.parse(offer.resource) : undefined,
      }
    );

    if (result) {
      await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: result.accepted ? 'accepted' : 'rejected',
          reasoning: result.reasoning,
        },
      });
    }
  } catch (error) {
    console.error('Agent evaluation error:', error);
  }
}
