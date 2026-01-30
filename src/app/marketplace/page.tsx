'use client';

import { useState, useEffect, useCallback } from 'react';

interface Conversation {
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
}

interface Request {
  id: string;
  content: string;
  budget?: number;
  deadline?: string;
  summary?: string;
  status: string;
  user: {
    id: string;
    name?: string;
    avatar?: string;
  };
  conversations: Conversation[];
  conversationCount: number;
  completedCount: number;
  createdAt: string;
}

export default function MarketplacePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/marketplace');
      const data = await response.json();
      if (data.requests) {
        setRequests(data.requests);
      }
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'tag-warning';
      case 'matching':
        return 'tag-primary';
      case 'completed':
      case 'accepted':
        return 'tag-success';
      case 'rejected':
        return 'tag-error';
      default:
        return 'tag';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'matching':
        return '匹配中';
      case 'completed':
        return '已完成';
      case 'accepted':
        return '已接受';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    return '刚刚';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">SecondMe</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400 text-sm">需求市场</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/network"
              className="btn btn-secondary text-sm py-2 px-4"
            >
              网络成员
            </a>
            <a
              href="/dashboard"
              className="btn btn-secondary text-sm py-2 px-4"
            >
              返回控制台
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">需求市场</h1>
          <span className="text-sm text-slate-400">
            共 {requests.length} 条需求
          </span>
        </div>

        {/* Requests List */}
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
        ) : requests.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">暂无需求</p>
            <p className="text-sm text-slate-400 mb-6">去控制台发布第一个需求</p>
            <a href="/dashboard" className="btn btn-primary">
              前往控制台
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="card overflow-hidden">
                {/* Request Header */}
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* User & Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-500 font-medium">
                            {request.user.name?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-900 font-medium">
                            {request.user.name || '未知用户'}
                          </span>
                          <span className="text-slate-400 text-sm ml-2">
                            {formatTime(request.createdAt)}
                          </span>
                        </div>
                        <span className={`tag ${getStatusStyle(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        {request.user.id === currentUserId && (
                          <span className="tag tag-primary">我的需求</span>
                        )}
                      </div>

                      <p className="text-slate-900">{request.content}</p>

                      {request.summary && (
                        <p className="text-sm text-slate-500 mt-2">
                          {request.summary}
                        </p>
                      )}

                      {/* Budget & Tags */}
                      <div className="flex items-center gap-3 mt-4">
                        {request.budget && (
                          <span className="tag tag-primary">
                            ¥{request.budget}
                          </span>
                        )}
                        {request.conversationCount > 0 && (
                          <span className="tag">
                            {request.conversationCount} 个对话
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900">
                        {request.conversationCount}
                      </div>
                      <div className="text-xs text-slate-400">对话数</div>
                      {request.completedCount > 0 && (
                        <div className="text-xs text-green-500 mt-1">
                          {request.completedCount} 已完成
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {request.conversationCount > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                      className="btn btn-secondary text-sm py-1.5 px-3 mt-4"
                    >
                      {expandedId === request.id ? '收起对话' : '查看对话'}
                    </button>
                  )}
                </div>

                {/* Conversations List */}
                {expandedId === request.id && (
                  <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-3">
                      对话 ({request.conversations?.length || 0})
                    </p>

                    {request.conversations?.length > 0 ? (
                      <div className="space-y-2">
                        {request.conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`p-4 rounded-lg transition-colors ${
                              conv.status === 'completed'
                                ? 'bg-green-50 border border-green-100'
                                : 'bg-white border border-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* User */}
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-500 text-sm font-medium">
                                  {conv.targetUser.name?.[0] || 'A'}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-slate-900 font-medium text-sm">
                                    {conv.targetUser.name || 'Agent'}
                                  </span>
                                  <span className={`tag text-xs ${getStatusStyle(conv.status)}`}>
                                    {getStatusText(conv.status)}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-sm truncate">
                                  {conv.messages[conv.messages.length - 1]?.content || '暂无消息'}
                                </p>
                                {conv.summary && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {conv.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-slate-400 text-sm">
                        暂无对话
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>网络活跃</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{requests.length} 条需求</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{requests.reduce((acc, r) => acc + (r.conversationCount || 0), 0)} 个对话</span>
          </div>
          <span>版本 v0.2.0</span>
        </div>
      </footer>
    </div>
  );
}
