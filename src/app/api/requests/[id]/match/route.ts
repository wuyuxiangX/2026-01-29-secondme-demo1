import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/session';
import { getUserInfo } from '@/lib/secondme';
import { simulateAgentNetwork } from '@/lib/agent';
import { prisma } from '@/lib/db';

// 触发 Agent 网络匹配
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // 查找需求
    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!requestRecord) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // 验证是否是需求的所有者
    if (requestRecord.user.secondmeId !== secondmeId) {
      return NextResponse.json(
        { error: 'Not authorized to match this request' },
        { status: 403 }
      );
    }

    // 模拟 Agent 网络匹配
    const offerSuggestions = simulateAgentNetwork({
      content: requestRecord.content,
      budget: requestRecord.budget ?? undefined,
      analysis: requestRecord.analysis ? JSON.parse(requestRecord.analysis) : undefined,
    });

    // 创建模拟用户和 Offers
    const createdOffers = [];

    for (const suggestion of offerSuggestions) {
      // 为每个模拟用户创建或查找用户记录
      const simulatedSecondmeId = `simulated_${suggestion.resource.name.replace(/\s+/g, '_')}`;

      let simulatedUser = await prisma.user.findUnique({
        where: { secondmeId: simulatedSecondmeId },
      });

      if (!simulatedUser) {
        simulatedUser = await prisma.user.create({
          data: {
            secondmeId: simulatedSecondmeId,
            name: `Agent_${suggestion.resource.name}`,
            accessToken: 'simulated',
            refreshToken: 'simulated',
            tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 创建 Offer
      const offer = await prisma.offer.create({
        data: {
          requestId: requestRecord.id,
          userId: simulatedUser.id,
          content: suggestion.content,
          reasoning: suggestion.reasoning,
          resource: JSON.stringify(suggestion.resource),
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

      createdOffers.push({
        id: offer.id,
        content: offer.content,
        reasoning: offer.reasoning,
        resource: suggestion.resource,
        confidence: suggestion.confidence,
        status: offer.status,
        user: offer.user,
        createdAt: offer.createdAt,
      });
    }

    // 更新需求状态
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'matching' },
    });

    return NextResponse.json({
      success: true,
      offers: createdOffers,
      message: `Found ${createdOffers.length} potential matches`,
    });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
