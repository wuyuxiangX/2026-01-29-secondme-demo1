import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getSession } from '@/lib/session';
import { chat, getUserInfo } from '@/lib/secondme';
import { prisma } from '@/lib/db';

// 需求分析的系统提示词
const ANALYSIS_SYSTEM_PROMPT = `你是一个专业的需求分析助手。用户会向你描述他们的需求，你需要分析这个需求并提取关键信息。

请以 JSON 格式返回分析结果，包含以下字段：
{
  "summary": "需求的一句话总结",
  "category": "需求类别 (如: 活动、物品、服务、技能等)",
  "requirements": ["需要的具体资源列表"],
  "preferences": ["用户的偏好或约束"],
  "suggestedTags": ["推荐的匹配标签"]
}

只返回 JSON，不要有其他内容。`;

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    const session = await getSession();

    if (!accessToken || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, budget, deadline } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.id || userInfo.openId;

    if (!secondmeId) {
      return NextResponse.json(
        { error: 'Unable to get user ID' },
        { status: 400 }
      );
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { secondmeId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          secondmeId,
          name: userInfo.name,
          avatar: userInfo.avatar,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          tokenExpiry: new Date(session.expiresAt),
        },
      });
    }

    // 调用 SecondMe Chat API 分析需求
    let analysis = null;
    try {
      const analysisPrompt = `请分析以下需求：\n\n${content}\n\n${budget ? `预算：${budget}元` : ''}\n${deadline ? `截止时间：${deadline}` : ''}`;

      const chatResult = await chat(accessToken, {
        message: analysisPrompt,
        systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      });

      // 尝试解析 JSON
      const jsonMatch = chatResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('Failed to analyze request:', err);
      // 分析失败不阻止创建需求
    }

    // 创建需求记录
    const newRequest = await prisma.request.create({
      data: {
        userId: user.id,
        content,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        analysis: analysis ? JSON.stringify(analysis) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: newRequest.id,
        content: newRequest.content,
        budget: newRequest.budget,
        deadline: newRequest.deadline,
        analysis,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Request creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取用户的需求列表
export async function GET() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);
    const secondmeId = userInfo.id || userInfo.openId;

    if (!secondmeId) {
      return NextResponse.json(
        { error: 'Unable to get user ID' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { secondmeId },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
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
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ requests: [] });
    }

    // 格式化返回数据
    const requests = user.requests.map((req) => ({
      id: req.id,
      content: req.content,
      budget: req.budget,
      deadline: req.deadline,
      analysis: req.analysis ? JSON.parse(req.analysis) : null,
      status: req.status,
      createdAt: req.createdAt,
      offers: req.offers.map((offer) => ({
        id: offer.id,
        content: offer.content,
        reasoning: offer.reasoning,
        resource: offer.resource ? JSON.parse(offer.resource) : null,
        status: offer.status,
        user: offer.user,
        createdAt: offer.createdAt,
      })),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
