/**
 * 对话列表 API
 * GET /api/network/conversations?requestId=xxx - 获取某个任务的所有对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversations } from '@/lib/agents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: '需要提供 requestId' }, { status: 400 });
    }

    const conversations = await getConversations(requestId);

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('[API] Get conversations failed:', error);
    return NextResponse.json(
      { error: '获取对话失败', details: String(error) },
      { status: 500 }
    );
  }
}
