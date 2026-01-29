'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RequestForm, { RequestFormData } from './RequestForm';
import RequestList from './RequestList';
import NetworkConversation from './NetworkConversation';

interface Request {
  id: string;
  content: string;
  analysis?: {
    summary?: string;
    category?: string;
    requirements?: string[];
    suggestedTags?: string[];
  };
  status: string;
  offers: Array<{
    id: string;
    content: string;
    reasoning?: string;
    resource?: {
      type: string;
      name: string;
      terms?: string;
    };
    status: string;
    user: {
      id: string;
      name?: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
}

interface MatchOffer {
  id: string;
  userId: string;
  userName: string;
  content: string;
  resource: {
    type: string;
    name: string;
    description: string;
    terms?: string;
  };
  reasoning: string;
  matchScore: number;
  matchReasons: string[];
  score: number;
  breakdown: {
    relevance: number;
    availability: number;
    value: number;
    userFit: number;
  };
  highlights: string[];
  concerns: string[];
  status: string;
}

interface MatchSummary {
  totalOffers: number;
  highMatches: number;
  mediumMatches: number;
  lowMatches: number;
  fulfilled: string[];
  unfulfilled: string[];
}

interface RequestAnalysis {
  summary: string;
  category: string;
  requirements: {
    essential: string[];
    optional: string[];
  };
  constraints: {
    budget?: number;
    deadline?: string;
    location?: string;
    capacity?: number;
  };
  tags: string[];
  clarificationNeeded: boolean;
  questions?: string[];
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

  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
  };

  // 提交新需求并广播到网络
  const handleSubmit = async (formData: RequestFormData) => {
    setIsSubmitting(true);
    setError(null);
    resetConversation();

    try {
      // 广播到网络
      setPhase('broadcasting');
      setLogs([]);
      addLog('📡 正在广播您的需求到网络...');
      addLog('🌐 正在寻找网络中的用户...');

      const broadcastRes = await fetch('/api/network/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!broadcastRes.ok) {
        const errorData = await broadcastRes.json();
        throw new Error(errorData.error || '广播失败');
      }

      const broadcastData = await broadcastRes.json();

      addLog(`✅ 广播完成！找到 ${broadcastData.data.totalUsers} 个用户`);
      addLog(`📨 成功对话: ${broadcastData.data.successCount} 个`);

      if (broadcastData.data.conversations) {
        for (const conv of broadcastData.data.conversations) {
          addLog(`💬 ${conv.userName}: ${conv.firstReply.slice(0, 50)}...`);
        }
      }

      setCurrentRequestId(broadcastData.data.requestId);
      setPhase('chatting');
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      addLog(`❌ 错误: ${err}`);
      setPhase('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 查看已有需求的对话
  const handleViewConversations = async (requestId: string) => {
    resetConversation();
    setCurrentRequestId(requestId);
    setPhase('chatting');
  };

  return (
    <div className="space-y-8">
      {/* Request Form Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#00f5ff] text-xl">{'>'}</span>
          <h2
            className="text-xl font-semibold tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            BROADCAST_REQUEST
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[#00f5ff]/30 to-transparent" />
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 border border-[#ff00ff]/50 bg-[#ff00ff]/10 text-[#ff00ff] text-sm font-mono">
            [ ERROR ] {error}
          </div>
        )}

        <RequestForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </section>

      {/* 网络对话进度和结果 */}
      {phase !== 'idle' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#8b5cf6] text-xl">{'⚡'}</span>
            <h2
              className="text-xl font-semibold tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NETWORK_CONVERSATION
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#8b5cf6]/30 to-transparent" />
            {(phase === 'chatting' || phase === 'completed') && (
              <button
                onClick={resetConversation}
                className="text-xs text-[#52525b] hover:text-[#00f5ff] transition-colors"
              >
                [CLOSE]
              </button>
            )}
          </div>

          {/* 广播中状态 */}
          {phase === 'broadcasting' && (
            <div className="cyber-card p-6">
              {/* 进度指示器 */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-[#00f5ff]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#00f5ff]/20 animate-pulse">
                    📡
                  </div>
                  <span className="text-sm">BROADCAST</span>
                </div>
                <div className="w-8 h-0.5 bg-[#00f5ff]/30" />
                <div className="flex items-center gap-2 text-[#52525b]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#52525b]/20">
                    💬
                  </div>
                  <span className="text-sm">CHAT</span>
                </div>
              </div>

              {/* 日志窗口 */}
              <div className="bg-[#0a0a0f]/80 rounded p-4 h-48 overflow-y-auto font-mono text-xs border border-[#27272a]">
                {logs.map((log, i) => (
                  <div key={i} className="text-[#a1a1aa] mb-1">{log}</div>
                ))}
                <div ref={logsEndRef} />
                <div className="text-[#00f5ff] animate-pulse">▊</div>
              </div>
            </div>
          )}

          {/* 对话展示 */}
          {(phase === 'chatting' || phase === 'completed') && currentRequestId && (
            <NetworkConversation
              requestId={currentRequestId}
              onComplete={() => {
                setPhase('completed');
                fetchRequests();
              }}
            />
          )}
        </section>
      )}

      {/* Requests List Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#ff00ff] text-xl">{'<>'}</span>
          <h2
            className="text-xl font-semibold tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            MY_REQUESTS
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[#ff00ff]/30 to-transparent" />
          {requests.length > 0 && (
            <span className="text-[#52525b] text-sm">
              [{requests.length}]
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="cyber-card p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[#00f5ff]">
              <span className="animate-pulse">LOADING</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        ) : (
          <RequestList requests={requests} onViewConversation={handleViewConversations} />
        )}
      </section>

      {/* Network Status */}
      <section className="cyber-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#00f5ff] rounded-full pulse-glow" />
            <span className="text-sm text-[#52525b] tracking-wider">
              AGENT_NETWORK_STATUS
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#52525b]">
            <div>
              <span className="text-[#00f5ff]">{requests.length}</span> REQUESTS
            </div>
            <div>
              <span className="text-[#ff00ff]">
                {requests.reduce((acc, r) => acc + r.offers.length, 0)}
              </span> OFFERS
            </div>
            <div>
              <span className="text-[#8b5cf6]">6</span> AGENTS ONLINE
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
