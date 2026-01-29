/**
 * 对话式需求分析 API
 * POST /api/agent/chat - 对话交互
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleConversation, createSession } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: '消息不能为空' },
        { status: 400 }
      );
    }

    // 处理对话
    const result = await handleConversation(sessionId || '', message);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.session.id,
        response: result.response,
        isReady: result.isReady,
        analysis: result.session.analysis,
        messageCount: result.session.messages.length,
      },
    });
  } catch (error) {
    console.error('Chat failed:', error);
    return NextResponse.json(
      { error: '对话失败', details: String(error) },
      { status: 500 }
    );
  }
}
