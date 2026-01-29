/**
 * Agent 网络匹配 API
 * POST /api/agent/match - 执行完整匹配流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { quickMatchRequest } from '@/lib/agents';

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

    // 执行匹配
    const result = await quickMatchRequest(content, budget, deadline);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.session.id,
        analysis: result.analysis,
        offers: result.matchResults.map(mr => ({
          ...mr.offer,
          score: mr.score,
          breakdown: mr.breakdown,
          highlights: mr.highlights,
          concerns: mr.concerns,
        })),
        summary: {
          totalOffers: result.summary.totalOffers,
          highMatches: result.summary.highMatches,
          mediumMatches: result.summary.mediumMatches,
          lowMatches: result.summary.lowMatches,
          fulfilled: result.summary.coverageAnalysis.fulfilled,
          unfulfilled: result.summary.coverageAnalysis.unfulfilled,
        },
      },
    });
  } catch (error) {
    console.error('Matching failed:', error);
    return NextResponse.json(
      { error: '匹配失败', details: String(error) },
      { status: 500 }
    );
  }
}
