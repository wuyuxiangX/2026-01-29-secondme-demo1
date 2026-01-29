/**
 * 用户 Agent
 * 代表用户分析资源、生成 Offer、评估匹配
 */

import { jsonChat, MODELS } from '../openrouter';
import type {
  UserResourceProfile,
  ResourceItem,
  RequestAnalysis,
  Offer,
  SimulatedUser
} from './types';

// 资源分析系统提示词
const RESOURCE_ANALYSIS_PROMPT = `你是用户的数字分身，负责分析用户拥有的资源和分享意愿。

基于用户的信息，分析他们可能愿意分享的资源。

返回 JSON：
{
  "resources": [
    {
      "id": "唯一ID",
      "type": "item|venue|equipment|service|skill|other",
      "name": "资源名称",
      "description": "简短描述",
      "availability": "available|limited|conditional",
      "terms": "使用条件（可选）",
      "value": 估值数字（可选）
    }
  ],
  "skills": ["技能1", "技能2"],
  "availability": "high|medium|low",
  "motivations": ["动机1", "动机2"],
  "preferences": {
    "willingToShare": true/false,
    "preferredExchange": "free|paid|exchange|any"
  }
}`;

// Offer 生成系统提示词
const OFFER_GENERATION_PROMPT = `你是用户的数字分身 Agent。你的主人有一些资源，现在有人发布了一个需求。

你的任务是判断主人的资源是否能满足这个需求，如果能，生成一个合适的 Offer。

考虑因素：
1. 资源是否匹配需求
2. 主人的分享意愿和动机
3. 时间、地点、预算是否合适
4. 对主人有什么好处

返回 JSON：
{
  "shouldOffer": true/false,
  "offer": {
    "content": "一句话描述 Offer",
    "resourceId": "匹配的资源ID",
    "reasoning": "为什么提供这个 Offer（对主人的好处）",
    "matchScore": 0-100的匹配度,
    "matchReasons": ["匹配理由1", "匹配理由2"]
  }
}

如果 shouldOffer 为 false，offer 可以省略，但请说明原因。`;

/**
 * 分析用户资源（基于用户数据）
 */
export async function analyzeUserResources(
  userInfo: {
    name: string;
    interests?: string[];
    softMemory?: Record<string, unknown>[];
  }
): Promise<Partial<UserResourceProfile>> {
  const context = `
用户名称：${userInfo.name}
兴趣爱好：${userInfo.interests?.join(', ') || '未知'}
知识库摘要：${JSON.stringify(userInfo.softMemory || [], null, 2)}
`;

  const result = await jsonChat<Partial<UserResourceProfile>>(
    `分析这个用户的资源和分享意愿：\n${context}`,
    RESOURCE_ANALYSIS_PROMPT,
    MODELS.EVALUATOR
  );

  return result;
}

/**
 * 为需求生成 Offer
 */
export async function generateOffer(
  user: SimulatedUser,
  request: RequestAnalysis
): Promise<Offer | null> {
  const context = `
需求信息：
- 摘要：${request.summary}
- 类别：${request.category}
- 必需条件：${request.requirements.essential.join(', ')}
- 可选条件：${request.requirements.optional.join(', ')}
- 预算：${request.constraints.budget || '无限制'}
- 时间：${request.constraints.deadline || '无限制'}
- 地点：${request.constraints.location || '无限制'}
- 人数：${request.constraints.capacity || '无限制'}
- 标签：${request.tags.join(', ')}

用户资源：
${JSON.stringify(user.profile, null, 2)}
`;

  const result = await jsonChat<{
    shouldOffer: boolean;
    offer?: {
      content: string;
      resourceId: string;
      reasoning: string;
      matchScore: number;
      matchReasons: string[];
    };
    reason?: string;
  }>(
    `判断是否应该为这个需求生成 Offer：\n${context}`,
    OFFER_GENERATION_PROMPT,
    MODELS.EVALUATOR
  );

  if (!result.shouldOffer || !result.offer) {
    return null;
  }

  // 找到匹配的资源
  const resource = user.profile.resources.find(r => r.id === result.offer!.resourceId)
    || user.profile.resources[0];  // 如果找不到，用第一个资源

  return {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: user.id,
    userName: user.name,
    requestId: '',  // 需要在外部设置
    content: result.offer.content,
    resource,
    reasoning: result.offer.reasoning,
    matchScore: result.offer.matchScore,
    matchReasons: result.offer.matchReasons,
    status: 'pending',
    createdAt: new Date(),
  };
}

/**
 * 批量为多个用户生成 Offers
 */
export async function generateOffersFromNetwork(
  users: SimulatedUser[],
  request: RequestAnalysis,
  requestId: string
): Promise<Offer[]> {
  const offers: Offer[] = [];

  // 并行处理所有用户
  const results = await Promise.allSettled(
    users.map(user => generateOffer(user, request))
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      result.value.requestId = requestId;
      offers.push(result.value);
    }
  }

  // 按匹配度排序
  offers.sort((a, b) => b.matchScore - a.matchScore);

  return offers;
}

// ============ 模拟用户数据 ============

/**
 * 获取模拟用户网络（用于演示）
 */
export function getSimulatedUsers(): SimulatedUser[] {
  return [
    {
      id: 'user_laowang',
      name: '老王',
      avatar: '👨‍🦳',
      profile: {
        userId: 'user_laowang',
        name: '老王',
        resources: [
          {
            id: 'res_rooftop',
            type: 'venue',
            name: '天台',
            description: '宽敞的楼顶天台，适合户外活动',
            availability: 'available',
            terms: '免费提供，需提前预约',
          },
          {
            id: 'res_bbq',
            type: 'equipment',
            name: '烧烤架',
            description: '大型户外烧烤架',
            availability: 'available',
            terms: '可借用',
          },
        ],
        skills: ['烧烤', '组织活动'],
        availability: 'high',
        motivations: ['喜欢热闹', '场地闲置想利用'],
        preferences: {
          willingToShare: true,
          preferredExchange: 'free',
        },
      },
    },
    {
      id: 'user_xiaoli',
      name: '小李',
      avatar: '👨‍💻',
      profile: {
        userId: 'user_xiaoli',
        name: '小李',
        resources: [
          {
            id: 'res_projector',
            type: 'equipment',
            name: '投影仪',
            description: '1080P 家用投影仪，配幕布',
            availability: 'available',
            terms: '可借用，需爱护',
            value: 2000,
          },
          {
            id: 'res_laptop',
            type: 'equipment',
            name: '笔记本电脑',
            description: 'MacBook Pro',
            availability: 'limited',
            terms: '紧急情况可借',
          },
        ],
        skills: ['技术支持', '视频剪辑'],
        availability: 'medium',
        motivations: ['设备闲置', '喜欢帮助朋友'],
        preferences: {
          willingToShare: true,
          preferredExchange: 'any',
        },
      },
    },
    {
      id: 'user_aliang',
      name: '阿亮',
      avatar: '🎵',
      profile: {
        userId: 'user_aliang',
        name: '阿亮',
        resources: [
          {
            id: 'res_speaker',
            type: 'equipment',
            name: 'Marshall 音响',
            description: '高品质蓝牙音响，音质出色',
            availability: 'available',
            terms: '免费提供，想炫耀一下',
            value: 3000,
          },
        ],
        skills: ['DJ', '音乐播放', '氛围营造'],
        availability: 'high',
        motivations: ['想炫耀音响', '喜欢社交活动'],
        preferences: {
          willingToShare: true,
          preferredExchange: 'free',
        },
      },
    },
    {
      id: 'user_afang',
      name: '阿芳',
      avatar: '🍿',
      profile: {
        userId: 'user_afang',
        name: '阿芳',
        resources: [
          {
            id: 'res_popcorn',
            type: 'item',
            name: '手工爆米花',
            description: '现做的美味焦糖爆米花',
            availability: 'limited',
            terms: '免费提供，帮忙宣传即可',
          },
          {
            id: 'res_snacks',
            type: 'item',
            name: '各种小食',
            description: '自制饼干、蛋糕等',
            availability: 'conditional',
            terms: '需提前预定',
          },
        ],
        skills: ['烹饪', '甜品制作', '活动策划'],
        availability: 'medium',
        motivations: ['拓展客源', '推广手艺', '喜欢交朋友'],
        preferences: {
          willingToShare: true,
          preferredExchange: 'exchange',
        },
      },
    },
    {
      id: 'user_laozhou',
      name: '老周',
      avatar: '🏕️',
      profile: {
        userId: 'user_laozhou',
        name: '老周',
        resources: [
          {
            id: 'res_camping',
            type: 'item',
            name: '露营装备',
            description: '折叠椅10把、野餐垫5个、帐篷2顶',
            availability: 'available',
            terms: '可借用，归还时需清洁',
          },
          {
            id: 'res_cooler',
            type: 'item',
            name: '保温箱',
            description: '大容量保温箱，可装饮料',
            availability: 'available',
          },
        ],
        skills: ['户外活动', '露营', '野外生存'],
        availability: 'medium',
        motivations: ['装备闲置', '喜欢户外活动'],
        preferences: {
          willingToShare: true,
          preferredExchange: 'free',
        },
      },
    },
    {
      id: 'user_xiaomei',
      name: '小美',
      avatar: '📸',
      profile: {
        userId: 'user_xiaomei',
        name: '小美',
        resources: [
          {
            id: 'res_camera',
            type: 'equipment',
            name: '相机',
            description: 'Sony A7III 全画幅相机',
            availability: 'conditional',
            terms: '可帮忙拍照，不外借设备',
            value: 15000,
          },
        ],
        skills: ['摄影', '修图', '视频拍摄'],
        availability: 'low',
        motivations: ['积累作品', '认识新朋友'],
        preferences: {
          willingToShare: false,
          preferredExchange: 'exchange',
        },
      },
    },
  ];
}
