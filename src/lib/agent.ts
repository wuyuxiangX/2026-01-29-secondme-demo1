/**
 * Agent 分析模块
 * 负责分析用户资源和意愿，生成 Offer 建议
 */

import { chat, getUserSoftMemory, getUserShades } from './secondme';

// 资源分析结果
export interface ResourceAnalysis {
  resources: Array<{
    type: string;
    name: string;
    description: string;
    availability: 'available' | 'limited' | 'conditional';
  }>;
  skills: string[];
  willingness: 'high' | 'medium' | 'low';
  motivations: string[];
}

// Offer 建议
export interface OfferSuggestion {
  content: string;
  reasoning: string;
  resource: {
    type: string;
    name: string;
    terms?: string;
  };
  confidence: number;
}

// Agent 分析用户资源的系统提示词
const RESOURCE_ANALYSIS_PROMPT = `你是用户的数字分身 Agent。基于用户的个人知识库和兴趣标签，分析用户可能拥有的资源、技能和分享意愿。

请以 JSON 格式返回分析结果：
{
  "resources": [
    {
      "type": "物品|场地|设备|交通|其他",
      "name": "资源名称",
      "description": "简短描述",
      "availability": "available|limited|conditional"
    }
  ],
  "skills": ["技能1", "技能2"],
  "willingness": "high|medium|low",
  "motivations": ["分享动机1", "分享动机2"]
}

只返回 JSON，不要有其他内容。`;

// Agent 生成 Offer 的系统提示词
const OFFER_GENERATION_PROMPT = `你是用户的数字分身 Agent。基于用户的资源分析和别人的需求，判断是否应该生成 Offer，以及生成什么样的 Offer。

请以 JSON 格式返回：
{
  "shouldOffer": true/false,
  "offer": {
    "content": "Offer 内容，一句话描述你能提供什么",
    "reasoning": "为什么要提供这个 Offer（对用户的好处）",
    "resource": {
      "type": "资源类型",
      "name": "资源名称",
      "terms": "条件或备注（可选）"
    },
    "confidence": 0.0-1.0
  }
}

如果 shouldOffer 为 false，offer 字段可以省略。
只返回 JSON，不要有其他内容。`;

/**
 * 分析用户的资源和意愿
 */
export async function analyzeUserResources(
  accessToken: string
): Promise<ResourceAnalysis | null> {
  try {
    // 获取用户的软记忆和兴趣标签
    const [softMemory, shades] = await Promise.all([
      getUserSoftMemory(accessToken, { pageSize: 50 }),
      getUserShades(accessToken),
    ]);

    // 构建分析提示词
    const context = `
用户的知识库摘要：
${JSON.stringify(softMemory, null, 2)}

用户的兴趣标签：
${shades.map((s) => `- ${s.name}: ${s.description || '无描述'}`).join('\n')}
`;

    const result = await chat(accessToken, {
      message: `请分析这个用户可能拥有的资源和分享意愿：\n${context}`,
      systemPrompt: RESOURCE_ANALYSIS_PROMPT,
    });

    // 解析 JSON
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ResourceAnalysis;
    }

    return null;
  } catch (error) {
    console.error('Failed to analyze user resources:', error);
    return null;
  }
}

/**
 * 基于需求生成 Offer 建议
 */
export async function generateOfferSuggestion(
  accessToken: string,
  request: {
    content: string;
    budget?: number;
    analysis?: Record<string, unknown>;
  },
  userResources: ResourceAnalysis
): Promise<OfferSuggestion | null> {
  try {
    const context = `
需求详情：
${request.content}
${request.budget ? `预算：${request.budget}元` : ''}
${request.analysis ? `需求分析：${JSON.stringify(request.analysis)}` : ''}

用户的资源分析：
${JSON.stringify(userResources, null, 2)}
`;

    const result = await chat(accessToken, {
      message: `基于用户的资源，判断是否应该为这个需求生成 Offer：\n${context}`,
      systemPrompt: OFFER_GENERATION_PROMPT,
    });

    // 解析 JSON
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.shouldOffer && parsed.offer) {
        return parsed.offer as OfferSuggestion;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to generate offer suggestion:', error);
    return null;
  }
}

/**
 * 模拟多用户 Agent 网络匹配
 * 在真实场景中，这会查询所有用户的 Agent 并并行分析
 * 这里我们模拟一些预设的用户资源
 */
export function simulateAgentNetwork(request: {
  content: string;
  budget?: number;
  analysis?: Record<string, unknown>;
}): OfferSuggestion[] {
  // 模拟用户数据 - 基于用户故事中的角色
  const simulatedUsers = [
    {
      name: '老王',
      resources: {
        resources: [
          { type: '场地', name: '天台', description: '开阔的天台空间', availability: 'available' as const },
        ],
        skills: ['烧烤'],
        willingness: 'high' as const,
        motivations: ['喜欢热闹', '场地闲置'],
      },
    },
    {
      name: '小李',
      resources: {
        resources: [
          { type: '设备', name: '投影仪', description: '1080P 家用投影仪', availability: 'available' as const },
        ],
        skills: ['技术支持'],
        willingness: 'medium' as const,
        motivations: ['设备闲置'],
      },
    },
    {
      name: '阿亮',
      resources: {
        resources: [
          { type: '设备', name: 'Marshall 音响', description: '高品质蓝牙音响', availability: 'available' as const },
        ],
        skills: ['DJ', '音乐播放'],
        willingness: 'high' as const,
        motivations: ['想炫耀音响', '喜欢社交'],
      },
    },
    {
      name: '阿芳',
      resources: {
        resources: [
          { type: '物品', name: '手工爆米花', description: '现做的美味爆米花', availability: 'limited' as const },
        ],
        skills: ['烹饪', '甜品制作'],
        willingness: 'high' as const,
        motivations: ['拓展客源', '推广手艺'],
      },
    },
    {
      name: '老周',
      resources: {
        resources: [
          { type: '物品', name: '露营装备', description: '折叠椅、垫子等', availability: 'available' as const },
        ],
        skills: ['户外活动'],
        willingness: 'medium' as const,
        motivations: ['装备闲置'],
      },
    },
  ];

  // 简单的关键词匹配逻辑
  const requestText = request.content.toLowerCase();
  const offers: OfferSuggestion[] = [];

  // 电影相关需求
  if (requestText.includes('电影') || requestText.includes('观影') || requestText.includes('投影')) {
    // 老王的天台
    offers.push({
      content: '天台可以用，免费',
      reasoning: '主人的天台空着，正好可以办户外活动',
      resource: { type: '场地', name: '天台', terms: '免费提供' },
      confidence: 0.9,
    });

    // 小李的投影仪
    offers.push({
      content: '投影仪可以借，1080P',
      reasoning: '投影仪闲置，适合电影之夜',
      resource: { type: '设备', name: '投影仪', terms: '借用' },
      confidence: 0.85,
    });

    // 阿亮的音响
    offers.push({
      content: '我带 Marshall 来',
      reasoning: '主人想炫耀音响，这是个好机会',
      resource: { type: '设备', name: 'Marshall 音响' },
      confidence: 0.8,
    });
  }

  // 户外/聚会相关
  if (requestText.includes('户外') || requestText.includes('聚会') || requestText.includes('朋友')) {
    // 阿芳的爆米花
    offers.push({
      content: '我带手工爆米花，免费',
      reasoning: '主人想拓展客源，这是个推广机会',
      resource: { type: '物品', name: '手工爆米花', terms: '免费提供' },
      confidence: 0.75,
    });

    // 老周的露营装备
    offers.push({
      content: '我带椅子和垫子，够 10 个人坐',
      reasoning: '露营装备闲置，正好派上用场',
      resource: { type: '物品', name: '露营装备', terms: '可供 10 人使用' },
      confidence: 0.7,
    });
  }

  return offers;
}
