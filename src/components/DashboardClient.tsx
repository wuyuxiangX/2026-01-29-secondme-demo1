'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RequestForm, { RequestFormData } from './RequestForm';
import RequestList from './RequestList';
import NetworkConversation from './NetworkConversation';

interface Request {
  id: string;
  content: string;
  summary?: string;
  status: string;
  conversations: Array<{
    id: string;
    targetUser: {
      id: string;
      name?: string;
      avatar?: string;
    };
    messages: Array<{ role: string; content: string; timestamp: string }>;
    summary?: string;
    status: string;
    createdAt: string;
  }>;
  conversationCount: number;
  createdAt: string;
}

// SSE 事件数据类型
interface SSEMessage {
  role: 'requester' | 'agent';
  content: string;
  timestamp: string;
}

interface RealtimeConversation {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  messages: SSEMessage[];
  status: 'ongoing' | 'concluded' | 'max_rounds' | 'error';
  conclusionReason?: string;
}

type Phase = 'idle' | 'broadcasting' | 'chatting' | 'completed';

export default function DashboardClient() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 网络对话状态
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 实时对话状态（SSE 流式更新）
  const [realtimeConversations, setRealtimeConversations] = useState<RealtimeConversation[]>([]);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动日志（只在容器内滚动，不影响页面）
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 获取需求列表
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/requests');
      const data = await response.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 重置对话状态
  const resetConversation = () => {
    setPhase('idle');
    setCurrentRequestId(null);
    setLogs([]);
    setRealtimeConversations([]);
  };

  // 提交新需求并广播到网络（SSE 流式版本）
  const handleSubmit = async (formData: RequestFormData) => {
    setIsSubmitting(true);
    setError(null);
    resetConversation();

    try {
      // 广播到网络
      setPhase('broadcasting');
      setLogs([]);
      addLog('正在广播您的需求到网络...');
      addLog('AI 分身开始自动对话...');

      const response = await fetch('/api/network/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '广播失败');
      }

      // 检查是否是 SSE 响应
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // 处理 SSE 流
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // 保留最后一行（可能不完整）
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                handleSSEEvent(currentEvent, parsed);
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        setPhase('completed');
        await fetchRequests();
      } else {
        // 降级到普通 JSON 响应
        const broadcastData = await response.json();
        addLog(`广播完成！找到 ${broadcastData.data.totalUsers} 个用户`);
        setCurrentRequestId(broadcastData.data.requestId);
        setPhase('chatting');
        await fetchRequests();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      addLog(`错误: ${err}`);
      setPhase('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理 SSE 事件
  const handleSSEEvent = (event: string, data: unknown) => {
    switch (event) {
      case 'conversation_start': {
        const { conversationId, targetUserName, targetUserAvatar } = data as {
          conversationId: string;
          targetUserId: string;
          targetUserName: string;
          targetUserAvatar?: string;
        };
        addLog(`开始与 ${targetUserName} 对话...`);
        setRealtimeConversations((prev) => [
          ...prev,
          {
            id: conversationId,
            targetUserId: (data as { targetUserId: string }).targetUserId,
            targetUserName,
            targetUserAvatar,
            messages: [],
            status: 'ongoing',
          },
        ]);
        // 切换到对话视图
        setPhase('chatting');
        break;
      }

      case 'message': {
        const { conversationId, message } = data as {
          conversationId: string;
          message: SSEMessage;
        };
        setRealtimeConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, message] }
              : conv
          )
        );
        const roleText = message.role === 'requester' ? '需求方' : '资源方';
        addLog(`${roleText}: ${message.content.slice(0, 30)}...`);
        break;
      }

      case 'conversation_end': {
        const { conversationId, status, conclusionReason, realConversationId } = data as {
          conversationId: string;
          realConversationId?: string;
          status: string;
          conclusionReason?: string;
        };
        setRealtimeConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  id: realConversationId || conv.id,
                  status: status as 'concluded' | 'max_rounds',
                  conclusionReason,
                }
              : conv
          )
        );
        addLog(`对话结束: ${conclusionReason || status}`);
        break;
      }

      case 'done': {
        const { requestId, totalConversations } = data as {
          requestId: string;
          totalConversations: number;
        };
        setCurrentRequestId(requestId);
        addLog(`全部对话完成！共 ${totalConversations} 个对话`);
        break;
      }

      case 'error': {
        const { error } = data as { error: string; conversationId?: string };
        addLog(`错误: ${error}`);
        break;
      }
    }
  };

  // 查看已有需求的对话
  const handleViewConversations = async (requestId: string) => {
    resetConversation();
    setCurrentRequestId(requestId);
    setPhase('chatting');
  };

  return (
    <div className="space-y-6">
      {/* 发布需求 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">广播需求</h2>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <RequestForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </section>

      {/* 网络对话进度和结果 */}
      {phase !== 'idle' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">网络对话</h2>
            {(phase === 'chatting' || phase === 'completed') && (
              <button
                onClick={resetConversation}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                关闭
              </button>
            )}
          </div>

          {/* 广播中状态 */}
          {phase === 'broadcasting' && (
            <div className="card p-6">
              {/* 进度指示器 */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-blue-500">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 pulse">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>
                  <span className="text-sm">广播中</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-200" />
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-sm">对话</span>
                </div>
              </div>

              {/* 日志窗口 */}
              <div ref={logsContainerRef} className="bg-slate-50 rounded-lg p-4 h-48 overflow-y-auto text-sm border border-slate-100">
                {logs.map((log, i) => (
                  <div key={i} className="text-slate-600 mb-1">{log}</div>
                ))}
                <div className="text-blue-500 pulse">...</div>
              </div>
            </div>
          )}

          {/* 实时对话展示 */}
          {(phase === 'chatting' || phase === 'completed') && realtimeConversations.length > 0 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {realtimeConversations.map((conv) => (
                  <RealtimeConversationCard key={conv.id} conversation={conv} />
                ))}
              </div>
            </div>
          )}

          {/* 已完成的对话展示（从数据库加载） */}
          {phase === 'completed' && currentRequestId && realtimeConversations.length === 0 && (
            <NetworkConversation
              requestId={currentRequestId}
              onComplete={() => {
                fetchRequests();
              }}
            />
          )}
        </section>
      )}

      {/* 需求列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">我的需求</h2>
          {requests.length > 0 && (
            <span className="text-sm text-slate-400">
              共 {requests.length} 条
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="card p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <svg className="w-5 h-5 loading" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>加载中...</span>
            </div>
          </div>
        ) : (
          <RequestList requests={requests} onViewConversation={handleViewConversations} />
        )}
      </section>

      {/* 网络状态 */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse"></span>
            <span className="text-sm text-slate-500">Agent 网络状态</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span><span className="text-blue-500 font-medium">{requests.length}</span> 需求</span>
            <span><span className="text-purple-500 font-medium">{requests.reduce((acc, r) => acc + (r.conversationCount || 0), 0)}</span> 对话</span>
            <span><span className="text-green-500 font-medium">6</span> 在线</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// 实时对话卡片组件
function RealtimeConversationCard({ conversation }: { conversation: RealtimeConversation }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动消息（只在容器内滚动，不影响页面）
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  const statusText = {
    ongoing: '对话中...',
    concluded: '已达成结论',
    max_rounds: '已达最大轮数',
    error: '对话出错',
  };

  const statusColor = {
    ongoing: 'text-blue-500',
    concluded: 'text-green-500',
    max_rounds: 'text-orange-500',
    error: 'text-red-500',
  };

  return (
    <div className="card overflow-hidden flex flex-col h-[400px]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {conversation.targetUserAvatar ? (
            <img
              src={conversation.targetUserAvatar}
              alt={conversation.targetUserName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm text-blue-500 font-medium">
                {conversation.targetUserName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-slate-900">
            {conversation.targetUserName}
          </span>
        </div>
        <span className={`text-xs ${statusColor[conversation.status]}`}>
          {statusText[conversation.status]}
        </span>
      </div>

      {/* 消息区域 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin bg-slate-50">
        {conversation.messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'requester' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-[85%] ${
                msg.role === 'requester'
                  ? 'bg-white border border-slate-200 rounded-bl-sm'
                  : 'bg-blue-500 text-white rounded-br-sm'
              }`}
            >
              <div
                className={`text-xs mb-1 ${
                  msg.role === 'requester' ? 'text-slate-400' : 'text-blue-100'
                }`}
              >
                {msg.role === 'requester' ? '需求方 AI' : conversation.targetUserName}
              </div>
              <div
                className={`text-sm whitespace-pre-wrap break-words ${
                  msg.role === 'requester' ? 'text-slate-700' : 'text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* 加载指示器 */}
        {conversation.status === 'ongoing' && (
          <div className="flex justify-end">
            <div className="bg-blue-500 rounded-2xl px-4 py-2 rounded-br-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态 */}
      {conversation.status !== 'ongoing' && (
        <div className="p-3 border-t border-slate-100">
          <div className={`text-center text-xs ${statusColor[conversation.status]}`}>
            {conversation.conclusionReason || statusText[conversation.status]}
          </div>
        </div>
      )}
    </div>
  );
}
