/**
 * 继续对话 API
 * POST /api/network/chat - 和某个用户继续对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { continueConversation, completeConversation } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message, action } = body;

    if (!conversationId) {
      return NextResponse.json({ error: '对话 ID 不能为空' }, { status: 400 });
    }

    // 完成对话
    if (action === 'complete') {
      await completeConversation(conversationId);
      return NextResponse.json({ success: true, message: '对话已完成' });
    }

    // 继续对话
    if (!message) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    console.log(`[API] Continuing conversation ${conversationId}`);

    const result = await continueConversation(conversationId, message);

    return NextResponse.json({
      success: true,
      data: {
        reply: result.reply,
        messages: result.messages,
      },
    });
  } catch (error) {
    console.error('[API] Chat failed:', error);
    return NextResponse.json(
      { error: '对话失败', details: String(error) },
      { status: 500 }
    );
  }
}
