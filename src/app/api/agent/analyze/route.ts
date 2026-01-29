/**
 * 需求分析 API
 * POST /api/agent/analyze - 分析用户需求
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeRequest } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, budget, deadline } = body;

    if (!content) {
      return NextResponse.json(
        { error: '需求内容不能为空' },
        { status: 400 }
      );
    }

    // 构建完整需求内容
    let fullContent = content;
    if (budget) {
      fullContent += `\n预算：${budget}元`;
    }
    if (deadline) {
      fullContent += `\n时间：${deadline}`;
    }

    // 分析需求
    const analysis = await analyzeRequest(fullContent);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        needsClarification: analysis.clarificationNeeded,
        questions: analysis.questions || [],
      },
    });
  } catch (error) {
    console.error('Request analysis failed:', error);
    return NextResponse.json(
      { error: '需求分析失败', details: String(error) },
      { status: 500 }
    );
  }
}
