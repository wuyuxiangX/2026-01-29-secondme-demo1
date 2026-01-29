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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-[#fbbf24] border-[#fbbf24]';
      case 'matching':
        return 'text-[#00f5ff] border-[#00f5ff]';
      case 'completed':
        return 'text-[#22c55e] border-[#22c55e]';
      case 'accepted':
        return 'text-[#22c55e] border-[#22c55e]';
      case 'rejected':
        return 'text-[#ef4444] border-[#ef4444]';
      default:
        return 'text-[#a1a1aa] border-[#a1a1aa]';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#00f5ff]/10 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="w-10 h-10 border-2 border-[#00f5ff] flex items-center justify-center hover:bg-[#00f5ff]/10 transition-colors">
              <span className="text-[#00f5ff] font-bold" style={{ fontFamily: 'var(--font-display)' }}>S</span>
            </a>
            <div>
              <span className="text-[#a1a1aa] text-sm tracking-widest uppercase">SecondMe</span>
              <span className="text-[#52525b] text-xs ml-2">/ MARKETPLACE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/dashboard"
              className="px-4 py-2 border border-[#52525b] text-[#a1a1aa] text-xs tracking-wider uppercase hover:border-[#00f5ff] hover:text-[#00f5ff] transition-colors"
            >
              MY DASHBOARD
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[#ff00ff] text-2xl">{'<>'}</span>
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            REQUEST_MARKETPLACE
          </h1>
          <div className="flex-1 h-px bg-gradient-to-r from-[#ff00ff]/30 to-transparent" />
          <span className="text-[#52525b] text-sm">
            [{requests.length} ACTIVE]
          </span>
        </div>

        {/* Requests Grid */}
        {isLoading ? (
          <div className="cyber-card p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00f5ff]">
              <span className="animate-pulse">LOADING NETWORK</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="cyber-card p-12 text-center">
            <div className="text-4xl mb-4 opacity-50">{'{ }'}</div>
            <p className="text-[#52525b]">[ NO REQUESTS IN NETWORK ]</p>
            <p className="text-sm text-[#52525b] mt-2">// 去 Dashboard 发布第一个需求</p>
            <a
              href="/dashboard"
              className="inline-block mt-6 px-6 py-3 border border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff]/10 transition-colors"
            >
              GO TO DASHBOARD
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="cyber-card corner-decoration">
                {/* Request Header */}
                <div className="p-6 border-b border-[#27272a]">
                  <div className="flex items-start justify-between gap-4">
                    {/* User & Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00f5ff]/20 to-[#ff00ff]/20 flex items-center justify-center border border-[#00f5ff]/30">
                          <span className="text-[#00f5ff] text-sm">
                            {request.user.name?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#e4e4e7] font-semibold">
                            {request.user.name || 'Unknown'}
                          </span>
                          <span className="text-[#52525b] text-xs ml-2">
                            {formatTime(request.createdAt)}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 border text-xs uppercase tracking-wider ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      <p className="text-[#e4e4e7] text-lg">{request.content}</p>

                      {request.summary && (
                        <p className="text-sm text-[#a1a1aa] mt-2 italic">
                          // {request.summary}
                        </p>
                      )}

                      {/* Budget */}
                      <div className="flex items-center gap-4 mt-4">
                        {request.budget && (
                          <span className="px-3 py-1 bg-[#00f5ff]/10 text-[#00f5ff] text-sm font-mono">
                            ¥{request.budget}
                          </span>
                        )}
                        {request.conversationCount > 0 && (
                          <span className="px-2 py-1 border border-[#8b5cf6]/50 text-[#8b5cf6] text-xs">
                            {request.conversationCount} 个对话
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#e4e4e7]" style={{ fontFamily: 'var(--font-display)' }}>
                        {request.conversationCount}
                      </div>
                      <div className="text-xs text-[#52525b]">CONVERSATIONS</div>
                      {request.completedCount > 0 && (
                        <div className="text-xs text-[#22c55e] mt-1">
                          {request.completedCount} COMPLETED
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-4">
                    {request.conversationCount > 0 && (
                      <button
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                        className="px-4 py-2 border border-[#52525b] text-[#a1a1aa] text-xs hover:border-[#00f5ff] hover:text-[#00f5ff] transition-colors"
                      >
                        {expandedId === request.id ? 'HIDE_CONVERSATIONS' : 'VIEW_CONVERSATIONS'}
                      </button>
                    )}
                    {request.user.id === currentUserId && (
                      <span className="px-4 py-2 border border-[#00f5ff] text-[#00f5ff] text-xs">
                        YOUR_REQUEST
                      </span>
                    )}
                  </div>
                </div>

                {/* Conversations List */}
                {expandedId === request.id && (
                  <div className="p-6 bg-[#0a0a0f]/50">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[#ff00ff]">{'<>'}</span>
                      <span className="text-sm text-[#52525b] tracking-wider">
                        CONVERSATIONS ({request.conversations?.length || 0})
                      </span>
                    </div>

                    {request.conversations?.length > 0 ? (
                      <div className="space-y-3">
                        {request.conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`p-4 border transition-colors ${
                              conv.status === 'completed'
                                ? 'border-[#22c55e]/50 bg-[#22c55e]/5'
                                : 'border-[#27272a] hover:border-[#00f5ff]/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* User */}
                              <div className="w-8 h-8 bg-gradient-to-br from-[#00f5ff]/20 to-[#ff00ff]/20 flex items-center justify-center border border-[#00f5ff]/30">
                                <span className="text-[#00f5ff] text-xs">
                                  {conv.targetUser.name?.[0] || 'A'}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[#e4e4e7] font-semibold text-sm">
                                    {conv.targetUser.name || 'Agent'}
                                  </span>
                                  <span className={`px-2 py-0.5 border text-xs uppercase ${getStatusColor(conv.status)}`}>
                                    {conv.status}
                                  </span>
                                </div>
                                <p className="text-[#a1a1aa] text-sm">
                                  {conv.messages[conv.messages.length - 1]?.content.slice(0, 150)}...
                                </p>
                                {conv.summary && (
                                  <p className="text-xs text-[#52525b] mt-1 italic">
                                    // {conv.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[#52525b] text-sm">
                        // 暂无对话
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#00f5ff]/10 py-6 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-[#52525b]">
          <div className="flex items-center gap-4">
            <span>NETWORK ACTIVE</span>
            <span className="w-1 h-1 bg-[#52525b] rounded-full" />
            <span>{requests.length} REQUESTS</span>
            <span className="w-1 h-1 bg-[#52525b] rounded-full" />
            <span>{requests.reduce((acc, r) => acc + (r.conversationCount || 0), 0)} CONVERSATIONS</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PROTOCOL v0.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
