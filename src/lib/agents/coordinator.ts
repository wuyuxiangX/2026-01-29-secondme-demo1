/**
 * 协调 Agent
 * 负责编排整个匹配流程：需求分析 → 网络匹配 → 评分排序 → 结果展示
 */

import { analyzeRequest, conversationalAnalysis } from './requestAnalyzer';
import { generateOffersFromNetwork, getSimulatedUsers } from './userAgent';
import { evaluateAndRankOffers, generateMatchingSummary, type MatchingSummary } from './matchingEngine';
import type {
  RequestAnalysis,
  Offer,
  MatchResult,
  ConversationMessage,
  NegotiationSession,
} from './types';

// 会话存储（内存中，后续可迁移到数据库）
const sessions = new Map<string, NegotiationSession>();

/**
 * 创建新的协商会话
 */
export function createSession(requestId: string): NegotiationSession {
  const session: NegotiationSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestId,
    status: 'analyzing',
    messages: [],
    offers: [],
    selectedOffers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  sessions.set(session.id, session);
  return session;
}

/**
 * 获取会话
 */
export function getSession(sessionId: string): NegotiationSession | undefined {
  return sessions.get(sessionId);
}

/**
 * 更新会话
 */
function updateSession(
  sessionId: string,
  updates: Partial<NegotiationSession>
): NegotiationSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  Object.assign(session, updates, { updatedAt: new Date() });
  sessions.set(sessionId, session);
  return session;
}

/**
 * 完整的匹配流程
 */
export interface MatchingResult {
  session: NegotiationSession;
  analysis: RequestAnalysis;
  offers: Offer[];
  matchResults: MatchResult[];
  summary: MatchingSummary;
}

/**
 * 执行完整匹配流程
 */
export async function executeMatching(
  requestContent: string,
  requestId: string
): Promise<MatchingResult> {
  // 1. 创建会话
  const session = createSession(requestId);

  try {
    // 2. 分析需求
    updateSession(session.id, { status: 'analyzing' });
    const analysis = await analyzeRequest(requestContent);
    updateSession(session.id, { analysis });

    // 3. 获取模拟用户网络
    const users = getSimulatedUsers();

    // 4. 生成 Offers
    updateSession(session.id, { status: 'matching' });
    const offers = await generateOffersFromNetwork(users, analysis, requestId);
    updateSession(session.id, { offers });

    // 5. 评估和排序
    const matchResults = await evaluateAndRankOffers(offers, analysis);

    // 6. 生成摘要
    const summary = generateMatchingSummary(matchResults, analysis);

    // 7. 更新会话状态
    updateSession(session.id, {
      status: 'completed',
      offers: matchResults.map(r => r.offer),
    });

    return {
      session: sessions.get(session.id)!,
      analysis,
      offers,
      matchResults,
      summary,
    };
  } catch (error) {
    updateSession(session.id, { status: 'failed' });
    throw error;
  }
}

/**
 * 对话式需求分析
 */
export async function handleConversation(
  sessionId: string,
  userMessage: string
): Promise<{
  response: string;
  isReady: boolean;
  session: NegotiationSession;
}> {
  let session = sessions.get(sessionId);

  if (!session) {
    session = createSession('');
  }

  // 添加用户消息
  session.messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  });

  // 获取 AI 回复
  const result = await conversationalAnalysis(userMessage, session.messages.slice(0, -1));

  // 添加助手回复
  session.messages.push({
    role: 'assistant',
    content: result.response,
    timestamp: new Date(),
  });

  // 如果分析完成，更新会话
  if (result.isReady && result.analysis) {
    session.analysis = result.analysis;
  }

  updateSession(session.id, {
    messages: session.messages,
    analysis: session.analysis,
  });

  return {
    response: result.response,
    isReady: result.isReady,
    session,
  };
}

/**
 * 快速匹配（跳过对话，直接分析和匹配）
 */
export async function quickMatchRequest(
  requestContent: string,
  budget?: number,
  deadline?: string
): Promise<MatchingResult> {
  const requestId = `req_${Date.now()}`;

  // 构建完整需求内容
  let fullContent = requestContent;
  if (budget) {
    fullContent += `\n预算：${budget}元`;
  }
  if (deadline) {
    fullContent += `\n时间：${deadline}`;
  }

  return executeMatching(fullContent, requestId);
}

/**
 * 接受 Offer
 */
export function acceptOffer(sessionId: string, offerId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  const offer = session.offers.find(o => o.id === offerId);
  if (!offer) return false;

  offer.status = 'accepted';
  if (!session.selectedOffers.includes(offerId)) {
    session.selectedOffers.push(offerId);
  }

  updateSession(sessionId, {
    offers: session.offers,
    selectedOffers: session.selectedOffers,
  });

  return true;
}

/**
 * 拒绝 Offer
 */
export function rejectOffer(sessionId: string, offerId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  const offer = session.offers.find(o => o.id === offerId);
  if (!offer) return false;

  offer.status = 'rejected';
  session.selectedOffers = session.selectedOffers.filter(id => id !== offerId);

  updateSession(sessionId, {
    offers: session.offers,
    selectedOffers: session.selectedOffers,
  });

  return true;
}

/**
 * 获取会话统计
 */
export function getSessionStats(): {
  total: number;
  analyzing: number;
  matching: number;
  completed: number;
  failed: number;
} {
  const stats = {
    total: sessions.size,
    analyzing: 0,
    matching: 0,
    completed: 0,
    failed: 0,
  };

  for (const session of sessions.values()) {
    switch (session.status) {
      case 'analyzing':
        stats.analyzing++;
        break;
      case 'matching':
        stats.matching++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  }

  return stats;
}
