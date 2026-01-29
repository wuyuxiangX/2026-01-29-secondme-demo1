/**
 * 需求分析 Agent
 * 负责理解用户需求，提取关键信息，必要时追问细节
 */

import { jsonChat, quickChat, chatStream, MODELS, type Message } from '../openrouter';
import type { RequestAnalysis, ConversationMessage } from './types';

// 需求分析系统提示词
const ANALYSIS_SYSTEM_PROMPT = `你是一个智能需求分析助手，帮助用户整理和明确他们的需求。

你的任务是：
1. 理解用户想要做什么
2. 提取关键信息：类别、必需条件、可选条件、预算、时间、地点、人数等
3. 判断信息是否足够完整
4. 如果信息不足，生成1-3个最关键的追问问题

请以 JSON 格式返回分析结果：
{
  "summary": "需求的一句话摘要",
  "category": "活动|服务|物品|场地|其他",
  "requirements": {
    "essential": ["必需条件1", "必需条件2"],
    "optional": ["可选条件1"]
  },
  "constraints": {
    "budget": 数字或null,
    "deadline": "时间描述或null",
    "location": "地点或null",
    "capacity": 人数或null
  },
  "tags": ["标签1", "标签2", "标签3"],
  "clarificationNeeded": true/false,
  "questions": ["追问问题1", "追问问题2"]
}

标签应该是用于匹配资源的关键词，例如：户外、电影、投影、音响、聚会、场地等。`;

// 对话式追问系统提示词
const CONVERSATION_SYSTEM_PROMPT = `你是用户的需求分析助手，正在帮助用户完善他们的需求。

你的风格：
- 友好、专业、高效
- 一次只问1-2个最关键的问题
- 理解用户回答后，继续补充或确认信息
- 当信息足够时，总结需求并确认

当需求足够清晰时，在回复末尾加上 [READY] 标记。`;

/**
 * 分析用户需求（单次分析）
 */
export async function analyzeRequest(content: string): Promise<RequestAnalysis> {
  const result = await jsonChat<RequestAnalysis>(
    `请分析这个需求：\n\n${content}`,
    ANALYSIS_SYSTEM_PROMPT,
    MODELS.ANALYST
  );

  return result;
}

/**
 * 对话式需求分析（支持多轮对话）
 */
export async function conversationalAnalysis(
  userMessage: string,
  history: ConversationMessage[] = []
): Promise<{
  response: string;
  isReady: boolean;
  analysis?: RequestAnalysis;
}> {
  // 构建消息历史
  const messages: Message[] = [
    { role: 'system', content: CONVERSATION_SYSTEM_PROMPT },
  ];

  // 添加历史消息
  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  // 添加当前消息
  messages.push({ role: 'user', content: userMessage });

  // 获取助手回复
  const response = await quickChat(
    userMessage,
    CONVERSATION_SYSTEM_PROMPT + '\n\n对话历史：\n' + history.map(m => `${m.role}: ${m.content}`).join('\n'),
    MODELS.ANALYST
  );

  const isReady = response.includes('[READY]');
  const cleanResponse = response.replace('[READY]', '').trim();

  // 如果需求已准备好，生成完整分析
  let analysis: RequestAnalysis | undefined;
  if (isReady) {
    const fullContext = history.map(m => m.content).join('\n') + '\n' + userMessage;
    analysis = await analyzeRequest(fullContext);
  }

  return {
    response: cleanResponse,
    isReady,
    analysis,
  };
}

/**
 * 流式对话分析
 */
export async function streamConversationalAnalysis(
  userMessage: string,
  history: ConversationMessage[] = []
): Promise<ReadableStream<string>> {
  const contextPrompt = history.length > 0
    ? '\n\n对话历史：\n' + history.map(m => `${m.role}: ${m.content}`).join('\n')
    : '';

  return chatStream({
    model: MODELS.ANALYST,
    messages: [
      { role: 'system', content: CONVERSATION_SYSTEM_PROMPT + contextPrompt },
      { role: 'user', content: userMessage },
    ],
  });
}

/**
 * 快速分析（用于匹配前的预处理）
 */
export async function quickAnalysis(content: string): Promise<{
  tags: string[];
  category: string;
  budget?: number;
}> {
  const prompt = `快速提取这个需求的关键信息：
"${content}"

返回 JSON：
{
  "tags": ["关键词1", "关键词2", ...],
  "category": "活动|服务|物品|场地|其他",
  "budget": 数字或null
}`;

  return jsonChat(prompt, '只返回 JSON，不要其他内容。', MODELS.EVALUATOR);
}
