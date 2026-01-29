/**
 * 匹配评分引擎
 * 计算 Offer 与需求的匹配度，生成详细评分和理由
 */

import { jsonChat, MODELS } from '../openrouter';
import type { RequestAnalysis, Offer, MatchResult } from './types';

// 匹配评估系统提示词
const MATCHING_EVALUATION_PROMPT = `你是一个智能匹配评估系统，负责评估 Offer 与需求的匹配程度。

评分维度（每项 0-100）：
1. 相关性 (relevance)：Offer 提供的资源与需求的相关程度
2. 可用性 (availability)：资源的可用程度和条件是否合适
3. 价值 (value)：资源对满足需求的价值贡献
4. 用户匹配 (userFit)：提供者与需求者的契合度

返回 JSON：
{
  "score": 综合得分(0-100),
  "breakdown": {
    "relevance": 分数,
    "availability": 分数,
    "value": 分数,
    "userFit": 分数
  },
  "highlights": ["亮点1", "亮点2"],
  "concerns": ["潜在问题1"],
  "summary": "一句话总结"
}`;

/**
 * 评估单个 Offer 的匹配度
 */
export async function evaluateMatch(
  offer: Offer,
  request: RequestAnalysis
): Promise<MatchResult> {
  const context = `
需求信息：
- 摘要：${request.summary}
- 类别：${request.category}
- 必需条件：${request.requirements.essential.join(', ')}
- 可选条件：${request.requirements.optional.join(', ')}
- 预算：${request.constraints.budget || '无限制'}
- 时间：${request.constraints.deadline || '无限制'}
- 标签：${request.tags.join(', ')}

Offer 信息：
- 内容：${offer.content}
- 提供者：${offer.userName}
- 资源：${offer.resource.name} (${offer.resource.type})
- 描述：${offer.resource.description}
- 条件：${offer.resource.terms || '无特殊条件'}
- 提供理由：${offer.reasoning}
`;

  const evaluation = await jsonChat<{
    score: number;
    breakdown: {
      relevance: number;
      availability: number;
      value: number;
      userFit: number;
    };
    highlights: string[];
    concerns: string[];
    summary: string;
  }>(
    `评估这个 Offer 与需求的匹配程度：\n${context}`,
    MATCHING_EVALUATION_PROMPT,
    MODELS.EVALUATOR
  );

  return {
    offer,
    score: evaluation.score,
    breakdown: evaluation.breakdown,
    highlights: evaluation.highlights,
    concerns: evaluation.concerns,
  };
}

/**
 * 批量评估并排序 Offers
 */
export async function evaluateAndRankOffers(
  offers: Offer[],
  request: RequestAnalysis
): Promise<MatchResult[]> {
  // 并行评估所有 Offers
  const results = await Promise.allSettled(
    offers.map(offer => evaluateMatch(offer, request))
  );

  const matchResults: MatchResult[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      matchResults.push(result.value);
    }
  }

  // 按综合得分排序
  matchResults.sort((a, b) => b.score - a.score);

  return matchResults;
}

/**
 * 快速匹配（基于标签和关键词，不调用 AI）
 */
export function quickMatch(
  offer: Offer,
  request: RequestAnalysis
): number {
  let score = 50; // 基础分

  // 标签匹配
  const offerKeywords = [
    offer.resource.name.toLowerCase(),
    offer.resource.type.toLowerCase(),
    offer.resource.description.toLowerCase(),
  ].join(' ');

  for (const tag of request.tags) {
    if (offerKeywords.includes(tag.toLowerCase())) {
      score += 10;
    }
  }

  // 类别匹配
  const categoryMapping: Record<string, string[]> = {
    '活动': ['venue', 'equipment', 'item'],
    '服务': ['service', 'skill'],
    '物品': ['item', 'equipment'],
    '场地': ['venue'],
  };

  const matchingTypes = categoryMapping[request.category] || [];
  if (matchingTypes.includes(offer.resource.type)) {
    score += 15;
  }

  // 可用性加分
  if (offer.resource.availability === 'available') {
    score += 10;
  } else if (offer.resource.availability === 'limited') {
    score += 5;
  }

  // 预算检查
  if (request.constraints.budget && offer.resource.value) {
    if (offer.resource.value <= request.constraints.budget) {
      score += 10;
    } else {
      score -= 10;
    }
  }

  // 限制分数范围
  return Math.min(100, Math.max(0, score));
}

/**
 * 生成匹配理由文案
 */
export function generateMatchReason(
  matchResult: MatchResult
): string {
  const { offer, score, highlights, concerns } = matchResult;

  let reason = '';

  // 根据分数生成开头
  if (score >= 80) {
    reason = `${offer.userName} 的 Offer 非常匹配！`;
  } else if (score >= 60) {
    reason = `${offer.userName} 可以提供帮助。`;
  } else {
    reason = `${offer.userName} 的资源可能有用。`;
  }

  // 添加亮点
  if (highlights.length > 0) {
    reason += ` ${highlights[0]}`;
  }

  // 如果有顾虑，添加提示
  if (concerns.length > 0 && score < 70) {
    reason += ` (注意: ${concerns[0]})`;
  }

  return reason;
}

/**
 * 综合匹配分析
 */
export interface MatchingSummary {
  totalOffers: number;
  highMatches: number;      // 80分以上
  mediumMatches: number;    // 60-79分
  lowMatches: number;       // 60分以下
  topRecommendation?: MatchResult;
  coverageAnalysis: {
    fulfilled: string[];    // 已满足的需求
    unfulfilled: string[];  // 未满足的需求
  };
}

/**
 * 生成匹配摘要
 */
export function generateMatchingSummary(
  results: MatchResult[],
  request: RequestAnalysis
): MatchingSummary {
  const summary: MatchingSummary = {
    totalOffers: results.length,
    highMatches: results.filter(r => r.score >= 80).length,
    mediumMatches: results.filter(r => r.score >= 60 && r.score < 80).length,
    lowMatches: results.filter(r => r.score < 60).length,
    topRecommendation: results[0],
    coverageAnalysis: {
      fulfilled: [],
      unfulfilled: [...request.requirements.essential],
    },
  };

  // 分析需求覆盖情况
  for (const result of results) {
    if (result.score >= 60) {
      // 简单的覆盖分析：检查 Offer 是否提到必需条件
      for (const req of request.requirements.essential) {
        const offerText = `${result.offer.content} ${result.offer.resource.description}`.toLowerCase();
        if (offerText.includes(req.toLowerCase())) {
          if (!summary.coverageAnalysis.fulfilled.includes(req)) {
            summary.coverageAnalysis.fulfilled.push(req);
          }
          summary.coverageAnalysis.unfulfilled = summary.coverageAnalysis.unfulfilled.filter(r => r !== req);
        }
      }
    }
  }

  return summary;
}
