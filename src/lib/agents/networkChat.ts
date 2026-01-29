/**
 * 网络对话模块
 * 简化版：直接和网络中的用户 AI 分身对话
 */

import { prisma } from '../prisma';
import { chat, refreshAccessToken, getUserInfo } from '../secondme';
import { quickChat } from '../openrouter';

// 对话消息类型
export interface Message {
  role: 'requester' | 'agent';
  content: string;
  timestamp: string;
}

// 广播结果
export interface BroadcastResult {
  conversationId: string;
  targetUserId: string;
  targetUserName: string;
  firstReply: string;
  status: 'success' | 'failed';
  error?: string;
}

// 数据库用户类型
interface DbUser {
  id: string;
  secondmeId: string;
  name: string | null;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

/**
 * 确保 token 有效
 */
async function ensureValidToken(user: DbUser): Promise<string> {
  const now = new Date();
  const expiry = new Date(user.tokenExpiry);

  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return user.accessToken;
  }

  console.log(`[NetworkChat] Refreshing token for ${user.name || user.id}`);

  try {
    const newTokens = await refreshAccessToken(user.refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiry: new Date(Date.now() + newTokens.expiresIn * 1000),
      },
    });
    return newTokens.accessToken;
  } catch (error) {
    console.error(`[NetworkChat] Token refresh failed:`, error);
    throw error;
  }
}

/**
 * 和某个用户的 AI 分身对话
 * 使用 SecondMe sessionId 实现原生多轮对话
 */
export async function chatWithUserAgent(
  targetUser: DbUser,
  message: string,
  sessionId?: string
): Promise<{ content: string; sessionId: string }> {
  const accessToken = await ensureValidToken(targetUser);

  console.log(`[NetworkChat] Chatting with ${targetUser.name || targetUser.id}${sessionId ? ` (session: ${sessionId.slice(0, 8)}...)` : ' (new session)'}...`);

  // 使用 SecondMe sessionId 实现多轮对话
  const response = await chat(accessToken, {
    message,
    sessionId,
  });

  return {
    content: response.content,
    sessionId: response.sessionId,
  };
}

/**
 * 获取网络中的用户（最多10人，排除指定用户）
 */
export async function getNetworkUsers(excludeUserId?: string, limit = 10): Promise<DbUser[]> {
  const users = await prisma.user.findMany({
    where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
    take: limit,
  });

  return users;
}

/**
 * 广播任务给网络中的所有用户
 */
export async function broadcastRequest(
  requestId: string,
  requestContent: string,
  requesterId: string
): Promise<BroadcastResult[]> {
  // 获取网络用户（最多10人，排除发起者）
  const users = await getNetworkUsers(requesterId, 10);

  console.log(`[NetworkChat] Broadcasting to ${users.length} users...`);

  const results: BroadcastResult[] = [];

  // 并行和所有用户对话
  const promises = users.map(async (user) => {
    try {
      // 构造初始消息
      const initialMessage = `你好！有人发布了一个需求，想问问你是否有资源可以帮忙：\n\n${requestContent}\n\n请根据你的情况，告诉我你是否有相关资源可以提供，或者有什么建议。`;

      // 和用户 AI 分身对话，获取回复和 sessionId
      const { content: reply, sessionId } = await chatWithUserAgent(user, initialMessage);

      // 创建对话记录
      const messages: Message[] = [
        { role: 'requester', content: initialMessage, timestamp: new Date().toISOString() },
        { role: 'agent', content: reply, timestamp: new Date().toISOString() },
      ];

      const conversation = await prisma.conversation.create({
        data: {
          requestId,
          targetUserId: user.id,
          messages: JSON.stringify(messages),
          secondmeSessionId: sessionId,  // 保存 SecondMe sessionId
          status: 'ongoing',
        },
      });

      return {
        conversationId: conversation.id,
        targetUserId: user.id,
        targetUserName: user.name || '未知用户',
        firstReply: reply,
        status: 'success' as const,
      };
    } catch (error) {
      console.error(`[NetworkChat] Failed to chat with ${user.name || user.id}:`, error);
      return {
        conversationId: '',
        targetUserId: user.id,
        targetUserName: user.name || '未知用户',
        firstReply: '',
        status: 'failed' as const,
        error: String(error),
      };
    }
  });

  const settled = await Promise.allSettled(promises);

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  // 更新 Request 状态
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'broadcasting' },
  });

  return results;
}

/**
 * 继续和某个用户对话
 * 使用 SecondMe sessionId 实现原生多轮对话
 */
export async function continueConversation(
  conversationId: string,
  message: string
): Promise<{ reply: string; messages: Message[] }> {
  // 获取对话记录
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { targetUser: true },
  });

  if (!conversation) {
    throw new Error('对话不存在');
  }

  // 解析历史消息
  const history: Message[] = JSON.parse(conversation.messages);

  // 添加新消息
  history.push({
    role: 'requester',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // 使用 SecondMe sessionId 实现原生多轮对话
  const { content: reply, sessionId } = await chatWithUserAgent(
    conversation.targetUser,
    message,
    conversation.secondmeSessionId || undefined
  );

  // 添加回复
  history.push({
    role: 'agent',
    content: reply,
    timestamp: new Date().toISOString(),
  });

  // 更新对话记录和 sessionId
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      messages: JSON.stringify(history),
      secondmeSessionId: sessionId,
    },
  });

  return { reply, messages: history };
}

/**
 * 完成对话（标记为已完成）
 */
export async function completeConversation(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'completed' },
  });
}

/**
 * 生成某个任务的总结
 */
export async function generateSummary(requestId: string): Promise<string> {
  // 获取任务和所有对话
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      conversations: {
        include: { targetUser: true },
      },
    },
  });

  if (!request) {
    throw new Error('任务不存在');
  }

  // 构建总结内容
  let summaryContent = `## 需求\n${request.content}\n\n## 对话总结\n`;

  for (const conv of request.conversations) {
    const messages: Message[] = JSON.parse(conv.messages);
    const userName = conv.targetUser.name || '未知用户';

    summaryContent += `\n### ${userName}\n`;
    for (const msg of messages) {
      const role = msg.role === 'requester' ? '需求方' : userName;
      summaryContent += `- **${role}**：${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`;
    }
  }

  // 使用 AI 生成总结
  const prompt = `请根据以下需求和对话记录，生成一个简洁的总结，说明有哪些人可以帮忙，提供什么资源：\n\n${summaryContent}`;

  const systemPrompt = `你是一个助手，负责总结对话结果。请用简洁的中文回答，列出：
1. 有多少人回复了
2. 有哪些人愿意帮忙，提供什么
3. 还有什么需求没有满足`;

  const summary = await quickChat(prompt, systemPrompt);

  // 保存总结
  await prisma.request.update({
    where: { id: requestId },
    data: {
      summary,
      status: 'completed',
    },
  });

  return summary;
}

/**
 * 获取任务的所有对话
 */
export async function getConversations(requestId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { requestId },
    include: { targetUser: true },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    targetUserId: conv.targetUserId,
    targetUserName: conv.targetUser.name || '未知用户',
    targetUserAvatar: conv.targetUser.avatar,
    messages: JSON.parse(conv.messages) as Message[],
    summary: conv.summary,
    status: conv.status,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));
}
