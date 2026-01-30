import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            requests: true,
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const members = users.map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      requestCount: user._count.requests,
      conversationCount: user._count.conversations,
      createdAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to fetch network members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network members' },
      { status: 500 }
    );
  }
}
