import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAccessToken } from '@/lib/session';
import { getUserInfo } from '@/lib/secondme';

// 获取所有公开需求
export async function GET() {
  try {
    // 获取当前用户 ID（可选，用于前端判断是否是自己的需求）
    let currentUserId: string | null = null;
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const userInfo = await getUserInfo(accessToken);
        const secondmeId = userInfo.email;
        if (secondmeId) {
          const currentUser = await prisma.user.findUnique({
            where: { secondmeId },
            select: { id: true },
          });
          currentUserId = currentUser?.id || null;
        }
      }
    } catch {
      // 用户未登录或获取失败，忽略
    }
    const requests = await prisma.request.findMany({
      where: {
        status: { not: 'cancelled' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            secondmeId: true,
          },
        },
        offers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 格式化返回数据
    const formattedRequests = requests.map((req) => ({
      id: req.id,
      content: req.content,
      budget: req.budget,
      deadline: req.deadline,
      analysis: req.analysis ? JSON.parse(req.analysis) : null,
      status: req.status,
      createdAt: req.createdAt,
      user: {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
      offers: req.offers.map((offer) => ({
        id: offer.id,
        content: offer.content,
        reasoning: offer.reasoning,
        resource: offer.resource ? JSON.parse(offer.resource) : null,
        status: offer.status,
        user: offer.user,
        createdAt: offer.createdAt,
      })),
      offerCount: req.offers.length,
      acceptedCount: req.offers.filter((o) => o.status === 'accepted').length,
    }));

    return NextResponse.json({ requests: formattedRequests, currentUserId });
  } catch (error) {
    console.error('Marketplace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
