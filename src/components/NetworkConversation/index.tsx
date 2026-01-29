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
      <div className="cyber-card rounded-lg p-8 text-center">
        <div className="animate-pulse text-[#00f5ff]">加载对话中...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="cyber-card rounded-lg p-8 text-center">
        <div className="text-[#52525b]">暂无对话</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📡</span>
          <h2 className="text-lg font-bold text-[#e4e4e7]">
            网络对话
            <span className="text-sm font-normal text-[#52525b] ml-2">
              共 {totalCount} 人
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            className="px-3 py-1.5 text-xs text-[#52525b] hover:text-[#00f5ff] border border-[#52525b]/30 hover:border-[#00f5ff]/30 rounded transition-all"
          >
            刷新
          </button>
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing}
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#8b5cf6]/20 to-[#ff00ff]/20 border border-[#8b5cf6]/50 rounded text-[#8b5cf6] hover:bg-[#8b5cf6]/20 disabled:opacity-50 transition-all"
          >
            {isSummarizing ? '生成中...' : '生成总结'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
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
