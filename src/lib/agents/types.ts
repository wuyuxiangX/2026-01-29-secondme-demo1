/**
 * Agent 系统类型定义
 */

// 需求分析结果
export interface RequestAnalysis {
  summary: string;           // 需求摘要
  category: string;          // 需求类别（活动、服务、物品等）
  requirements: {
    essential: string[];     // 必需条件
    optional: string[];      // 可选条件
  };
  constraints: {
    budget?: number;         // 预算
    deadline?: string;       // 时间限制
    location?: string;       // 地点要求
    capacity?: number;       // 人数要求
  };
  tags: string[];            // 标签（用于匹配）
  clarificationNeeded: boolean;  // 是否需要追问
  questions?: string[];      // 追问问题
}

// 用户资源档案
export interface UserResourceProfile {
  userId: string;
  name: string;
  resources: ResourceItem[];
  skills: string[];
  availability: 'high' | 'medium' | 'low';
  motivations: string[];
  preferences: {
    willingToShare: boolean;
    preferredExchange: 'free' | 'paid' | 'exchange' | 'any';
  };
}

// 资源项
export interface ResourceItem {
  id: string;
  type: 'item' | 'venue' | 'equipment' | 'service' | 'skill' | 'other';
  name: string;
  description: string;
  availability: 'available' | 'limited' | 'conditional';
  terms?: string;           // 使用条件
  value?: number;           // 估值
}

// Offer（报价/提议）
export interface Offer {
  id: string;
  userId: string;
  userName: string;
  requestId: string;
  content: string;          // Offer 内容描述
  resource: ResourceItem;
  reasoning: string;        // Agent 生成理由
  matchScore: number;       // 匹配度 0-100
  matchReasons: string[];   // 匹配理由列表
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date;
}

// 匹配结果
export interface MatchResult {
  offer: Offer;
  score: number;            // 综合得分 0-100
  breakdown: {
    relevance: number;      // 相关性得分
    availability: number;   // 可用性得分
    value: number;          // 价值得分
    userFit: number;        // 用户匹配度
  };
  highlights: string[];     // 亮点
  concerns: string[];       // 潜在问题
}

// 对话消息
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Agent 协商会话
export interface NegotiationSession {
  id: string;
  requestId: string;
  status: 'analyzing' | 'matching' | 'negotiating' | 'completed' | 'failed';
  messages: ConversationMessage[];
  analysis?: RequestAnalysis;
  offers: Offer[];
  selectedOffers: string[];  // 选中的 Offer IDs
  createdAt: Date;
  updatedAt: Date;
}

// 模拟用户数据（用于演示）
export interface SimulatedUser {
  id: string;
  name: string;
  avatar?: string;
  profile: UserResourceProfile;
}
