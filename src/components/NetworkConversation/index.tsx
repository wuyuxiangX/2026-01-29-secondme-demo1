'use client';

import { useState, useEffect, useCallback } from 'react';
import { NetworkConversationProps, Conversation } from './types';
import { ConversationThread } from './ConversationThread';
import { SummaryCard } from './SummaryCard';

export function NetworkConversation({
  requestId,
  onComplete,
}: NetworkConversationProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // 获取对话列表
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/network/conversations?requestId=${requestId}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.data);
      } else {
        setError(data.error || '获取对话失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('Fetch conversations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  // 初始加载
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 发送消息
  const handleSendMessage = async (conversationId: string, message: string) => {
    setSendingIds((prev) => new Set(prev).add(conversationId));

    try {
      const res = await fetch('/api/network/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message }),
      });

      const data = await res.json();

      if (data.success) {
        // 更新对话消息
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: data.data.messages }
              : conv
          )
        );
      } else {
        setError(data.error || '发送消息失败');
      }
    } catch (err) {
      setError('发送消息失败');
      console.error('Send message error:', err);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
    }
  };

  // 标记对话完成
  const handleComplete = async (conversationId: string) => {
    try {
      const res = await fetch('/api/network/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action: 'complete' }),
      });

      const data = await res.json();

      if (data.success) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, status: 'completed' } : conv
          )
        );
      }
    } catch (err) {
      console.error('Complete conversation error:', err);
    }
  };

  // 生成总结
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setError(null);

    try {
      const res = await fetch('/api/network/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (data.success) {
        setSummary(data.data.summary);
        onComplete?.(data.data.summary);
      } else {
        setError(data.error || '生成总结失败');
      }
    } catch (err) {
      setError('生成总结失败');
      console.error('Generate summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const completedCount = conversations.filter((c) => c.status === 'completed').length;
  const totalCount = conversations.length;

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <svg className="w-5 h-5 loading" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>加载对话中...</span>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-400">暂无对话</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-slate-900">
            网络对话
          </span>
          <span className="text-sm text-slate-400">
            共 {totalCount} 人
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            className="btn btn-secondary text-sm py-1.5 px-3"
          >
            刷新
          </button>
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="btn btn-primary text-sm py-1.5 px-3"
          >
            {isSummarizing ? '生成中...' : '生成总结'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 对话网格 */}
      <div className="grid md:grid-cols-2 gap-4">
        {conversations.map((conversation) => (
          <ConversationThread
            key={conversation.id}
            conversation={conversation}
            onSendMessage={handleSendMessage}
            onComplete={handleComplete}
            isSending={sendingIds.has(conversation.id)}
          />
        ))}
      </div>

      {/* 总结卡片 */}
      {summary && (
        <SummaryCard
          summary={summary}
          totalCount={totalCount}
          completedCount={completedCount}
        />
      )}
    </div>
  );
}

export default NetworkConversation;
