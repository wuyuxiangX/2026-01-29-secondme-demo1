/**
 * Offer 操作 API
 * POST /api/agent/offer/accept - 接受 Offer
 * POST /api/agent/offer/reject - 拒绝 Offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptOffer, rejectOffer, getSession } from '@/lib/agents';

type Params = Promise<{ action: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { action } = await params;
    const body = await request.json();
    const { sessionId, offerId } = body;

    if (!sessionId || !offerId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    let success = false;

    if (action === 'accept') {
      success = acceptOffer(sessionId, offerId);
    } else if (action === 'reject') {
      success = rejectOffer(sessionId, offerId);
    } else {
      return NextResponse.json(
        { error: '无效的操作' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: '操作失败，会话或 Offer 不存在' },
        { status: 404 }
      );
    }

    const session = getSession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        action,
        offerId,
        session,
      },
    });
  } catch (error) {
    console.error('Offer action failed:', error);
    return NextResponse.json(
      { error: '操作失败', details: String(error) },
      { status: 500 }
    );
  }
}
