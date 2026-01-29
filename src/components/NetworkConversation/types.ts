/**
 * 网络对话组件类型定义
 */

// 消息类型
export interface Message {
  role: 'requester' | 'agent';
  content: string;
  timestamp: string;
}

// 对话类型
export interface Conversation {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar: string | null;
  messages: Message[];
  summary: string | null;
  status: 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 广播响应
export interface BroadcastResponse {
  requestId: string;
  totalUsers: number;
  successCount: number;
  failedCount: number;
  conversations: Array<{
    conversationId: string;
    userName: string;
    firstReply: string;
  }>;
}

// 对话线程组件 Props
export interface ConversationThreadProps {
  conversation: Conversation;
  onSendMessage: (conversationId: string, message: string) => Promise<void>;
  onComplete: (conversationId: string) => Promise<void>;
  isSending?: boolean;
}

// 总结卡片组件 Props
export interface SummaryCardProps {
  summary: string;
  totalCount: number;
  completedCount: number;
}

// 主组件 Props
export interface NetworkConversationProps {
  requestId: string;
  onComplete?: (summary: string) => void;
}
