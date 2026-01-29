/**
 * 网络对话模块
 * 简化版：直接和网络中的用户 AI 分身对话
 */

import { prisma } from '../prisma';
import { chat, refreshAccessToken, getUserInfo } from '../secondme';
import { quickChat, jsonChat } from '../openrouter';

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
 * 广播任务给网络中的所有用户（自动多轮对话版本）
 */
export async function broadcastRequest(
  requestId: string,
  requestContent: string,
  requesterId: string
): Promise<BroadcastResult[]> {
  // 获取需求方用户
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
  });

  if (!requester) {
    throw new Error('需求方用户不存在');
  }

  // 获取网络用户（最多10人，排除发起者）
  const users = await getNetworkUsers(requesterId, 10);

  console.log(`[NetworkChat] Broadcasting to ${users.length} users with auto-conversation...`);

  const results: BroadcastResult[] = [];

  // 并行和所有用户进行自动多轮对话
  const promises = users.map(async (user) => {
    try {
      // 进行自动多轮对话
      const result = await autoConversation(
        requester,
        user,
        requestContent,
        5 // 最多 5 轮
      );

      // 创建对话记录
      const conversation = await prisma.conversation.create({
        data: {
          requestId,
          targetUserId: user.id,
          messages: JSON.stringify(result.messages),
          secondmeSessionId: result.agentSessionId,
          requesterSessionId: result.requesterSessionId,
          conclusionStatus: result.status,
          status: result.status === 'concluded' ? 'completed' : 'ongoing',
        },
      });

      const lastAgentMessage = result.messages.filter((m) => m.role === 'agent').pop();

      return {
        conversationId: conversation.id,
        targetUserId: user.id,
        targetUserName: user.name || '未知用户',
        firstReply: lastAgentMessage?.content || '',
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
 * 判断对话是否已经达成结论
 * 使用 AI 分析对话内容，判断是否已经明确资源方能否提供帮助
 */
export async function isConversationConcluded(messages: Message[]): Promise<{
  concluded: boolean;
  reason: string;
}> {
  // 至少需要 4 条消息（两轮对话）才有意义判断
  if (messages.length < 4) {
    return { concluded: false, reason: '对话轮数不足' };
  }

  // 构建对话内容用于分析
  const conversationText = messages
    .map((m) => `${m.role === 'requester' ? '需求方' : '资源方'}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `你是一个对话分析助手。分析以下需求方和资源方之间的对话，判断是否已经明确得出结论。

结论明确的标准：
1. 资源方已经明确表示能或不能提供帮助
2. 如果能帮忙，已经说明具体能提供什么
3. 双方已经就关键细节达成初步共识（如时间、地点、条件等）

如果对话仍在询问细节、等待确认、或者信息不完整，则结论尚未明确。

请返回 JSON 格式：{"concluded": true/false, "reason": "简要说明原因"}`;

  try {
    const result = await jsonChat<{ concluded: boolean; reason: string }>(
      conversationText,
      systemPrompt
    );
    return result;
  } catch (error) {
    console.error('[NetworkChat] Failed to analyze conversation:', error);
    // 出错时默认继续对话
    return { concluded: false, reason: '分析失败，继续对话' };
  }
}

/**
 * 自动对话结果
 */
export interface AutoConversationResult {
  messages: Message[];
  status: 'concluded' | 'max_rounds';
  requesterSessionId: string;
  agentSessionId: string;
  conclusionReason?: string;
}

/**
 * 消息回调类型 - 用于实时推送每条新消息
 */
export type MessageCallback = (message: Message) => void;

/**
 * 自动多轮对话
 * 需求方和资源方的 AI 分身自动互相对话，直到达成结论或达到最大轮数
 */
export async function autoConversation(
  requester: DbUser,
  targetUser: DbUser,
  requestContent: string,
  maxRounds: number = 5,
  onMessage?: MessageCallback
): Promise<AutoConversationResult> {
  const messages: Message[] = [];
  let requesterSessionId = '';
  let agentSessionId = '';

  // 第一条消息：需求方发起
  const initialMessage = `你好！我想发起一个需求，想问问你是否有资源可以帮忙：\n\n${requestContent}\n\n请根据你的情况，告诉我你是否有相关资源可以提供，或者有什么建议。`;

  console.log(`[AutoConversation] Starting conversation between ${requester.name} and ${targetUser.name}`);

  // 轮流对话
  for (let round = 0; round < maxRounds; round++) {
    console.log(`[AutoConversation] Round ${round + 1}/${maxRounds}`);

    // 1. 资源方 AI 分身回复
    const lastRequesterMessage = round === 0 ? initialMessage : messages[messages.length - 1].content;

    try {
      const { content: agentReply, sessionId: newAgentSessionId } = await chatWithUserAgent(
        targetUser,
        lastRequesterMessage,
        agentSessionId || undefined
      );
      agentSessionId = newAgentSessionId;

      const agentMessage: Message = {
        role: 'agent',
        content: agentReply,
        timestamp: new Date().toISOString(),
      };
      messages.push(agentMessage);
      onMessage?.(agentMessage);

      console.log(`[AutoConversation] Agent replied: ${agentReply.slice(0, 50)}...`);
    } catch (error) {
      console.error(`[AutoConversation] Agent reply failed:`, error);
      break;
    }

    // 2. 判断是否已经达成结论
    const conclusion = await isConversationConcluded(messages);
    if (conclusion.concluded) {
      console.log(`[AutoConversation] Concluded: ${conclusion.reason}`);
      return {
        messages,
        status: 'concluded',
        requesterSessionId,
        agentSessionId,
        conclusionReason: conclusion.reason,
      };
    }

    // 如果已经是最后一轮，不再需要需求方追问
    if (round === maxRounds - 1) {
      break;
    }

    // 3. 需求方 AI 分身追问（基于资源方的回复）
    // 构建追问的上下文
    const followUpContext = messages
      .slice(-4) // 最近 4 条消息
      .map((m) => `${m.role === 'requester' ? '我' : '对方'}: ${m.content}`)
      .join('\n');

    const followUpPrompt = `我正在为朋友咨询一个需求（${requestContent}）。以下是我们的对话：\n\n${followUpContext}\n\n请根据对方的回复，提出一个合理的追问或确认，帮助进一步明确对方是否能提供帮助以及具体细节。如果对方已经明确表示不能帮忙，就礼貌地感谢对方。`;

    try {
      const { content: requesterReply, sessionId: newRequesterSessionId } = await chatWithUserAgent(
        requester,
        followUpPrompt,
        requesterSessionId || undefined
      );
      requesterSessionId = newRequesterSessionId;

      const requesterMessage: Message = {
        role: 'requester',
        content: requesterReply,
        timestamp: new Date().toISOString(),
      };
      messages.push(requesterMessage);
      onMessage?.(requesterMessage);

      console.log(`[AutoConversation] Requester replied: ${requesterReply.slice(0, 50)}...`);
    } catch (error) {
      console.error(`[AutoConversation] Requester reply failed:`, error);
      break;
    }
  }

  console.log(`[AutoConversation] Max rounds reached`);
  return {
    messages,
    status: 'max_rounds',
    requesterSessionId,
    agentSessionId,
  };
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

// SSE 事件类型
export interface SSEEvent {
  event: 'conversation_start' | 'message' | 'conversation_end' | 'error' | 'done';
  data: unknown;
}

/**
 * SSE 事件发送器类型
 */
export type SSEWriter = {
  write: (event: SSEEvent) => Promise<void>;
  close: () => void;
};

/**
 * 广播任务并通过 SSE 实时推送消息
 */
export async function broadcastRequestWithStream(
  requestId: string,
  requestContent: string,
  requesterId: string,
  writer: SSEWriter
): Promise<void> {
  // 获取需求方用户
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
  });

  if (!requester) {
    await writer.write({
      event: 'error',
      data: { error: '需求方用户不存在' },
    });
    writer.close();
    return;
  }

  // 获取网络用户（最多10人，排除发起者）
  const users = await getNetworkUsers(requesterId, 10);

  console.log(`[NetworkChat] Broadcasting to ${users.length} users with SSE...`);

  // 为每个用户创建临时的对话 ID 映射
  const conversationMap = new Map<string, string>();

  // 对每个用户顺序执行自动对话（顺序执行便于调试，可改为并行）
  for (const user of users) {
    const tempConvId = `temp_${user.id}`;

    // 发送对话开始事件
    await writer.write({
      event: 'conversation_start',
      data: {
        conversationId: tempConvId,
        targetUserId: user.id,
        targetUserName: user.name || '未知用户',
        targetUserAvatar: user.avatar,
      },
    });

    try {
      // 进行自动多轮对话，带消息回调
      const result = await autoConversation(
        requester,
        user,
        requestContent,
        5,
        // 每条消息都通过 SSE 推送
        async (message) => {
          await writer.write({
            event: 'message',
            data: {
              conversationId: tempConvId,
              message,
            },
          });
        }
      );

      // 创建对话记录
      const conversation = await prisma.conversation.create({
        data: {
          requestId,
          targetUserId: user.id,
          messages: JSON.stringify(result.messages),
          secondmeSessionId: result.agentSessionId,
          requesterSessionId: result.requesterSessionId,
          conclusionStatus: result.status,
          status: result.status === 'concluded' ? 'completed' : 'ongoing',
        },
      });

      conversationMap.set(tempConvId, conversation.id);

      // 发送对话结束事件
      await writer.write({
        event: 'conversation_end',
        data: {
          conversationId: tempConvId,
          realConversationId: conversation.id,
          status: result.status,
          conclusionReason: result.conclusionReason,
        },
      });
    } catch (error) {
      console.error(`[NetworkChat] Failed to chat with ${user.name || user.id}:`, error);

      // 发送错误事件
      await writer.write({
        event: 'error',
        data: {
          conversationId: tempConvId,
          error: String(error),
        },
      });
    }
  }

  // 更新 Request 状态
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'completed' },
  });

  // 发送完成事件
  await writer.write({
    event: 'done',
    data: {
      requestId,
      totalConversations: users.length,
    },
  });

  writer.close();
}
