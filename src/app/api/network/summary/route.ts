/**
 * 生成总结 API
 * POST /api/network/summary - 生成某个任务的对话总结
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSummary } from '@/lib/agents';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: '需要提供 requestId' }, { status: 400 });
    }

    console.log(`[API] Generating summary for request ${requestId}`);

    const summary = await generateSummary(requestId);

    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('[API] Generate summary failed:', error);
    return NextResponse.json(
      { error: '生成总结失败', details: String(error) },
      { status: 500 }
    );
  }
}

// 获取已生成的总结
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: '需要提供 requestId' }, { status: 400 });
    }

    const req = await prisma.request.findUnique({
      where: { id: requestId },
      select: { summary: true, status: true },
    });

    if (!req) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: req.summary,
        status: req.status,
      },
    });
  } catch (error) {
    console.error('[API] Get summary failed:', error);
    return NextResponse.json(
      { error: '获取总结失败', details: String(error) },
      { status: 500 }
    );
  }
}
