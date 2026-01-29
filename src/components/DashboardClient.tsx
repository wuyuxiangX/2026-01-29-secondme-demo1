'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RequestForm, { RequestFormData } from './RequestForm';
import RequestList from './RequestList';
import MatchResults from './MatchResults';

interface Request {
  id: string;
  content: string;
  budget?: number;
  deadline?: string;
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

type Phase = 'idle' | 'analyzing' | 'matching' | 'results';

export default function DashboardClient() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent 协商状态
  const [phase, setPhase] = useState<Phase>('idle');
  const [sessionId, setSessionId] = useState('');
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);
  const [offers, setOffers] = useState<MatchOffer[]>([]);
  const [summary, setSummary] = useState<MatchSummary | null>(null);
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

  // 重置协商状态
  const resetNegotiation = () => {
    setPhase('idle');
    setAnalysis(null);
    setOffers([]);
    setSummary(null);
    setLogs([]);
    setSessionId('');
  };

  // 提交新需求并自动触发 Agent 匹配
  const handleSubmit = async (formData: RequestFormData) => {
    setIsSubmitting(true);
    setError(null);
    resetNegotiation();

    try {
      // 阶段1：分析需求
      setPhase('analyzing');
      setLogs([]);
      addLog('🔍 正在分析您的需求...');

      const analyzeRes = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!analyzeRes.ok) throw new Error('分析请求失败');

      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData.data.analysis);

      addLog(`✅ 需求分析完成: ${analyzeData.data.analysis.summary}`);
      addLog(`📋 类别: ${analyzeData.data.analysis.category}`);
      addLog(`🏷️ 标签: ${analyzeData.data.analysis.tags.join(', ')}`);

      // 阶段2：网络匹配
      setPhase('matching');
      addLog('🌐 正在扫描 Agent 网络...');
      addLog('🤖 老王的 Agent 正在分析资源...');
      addLog('🤖 小李的 Agent 正在分析资源...');
      addLog('🤖 阿亮的 Agent 正在分析资源...');
      addLog('🤖 阿芳的 Agent 正在分析资源...');
      addLog('🤖 老周的 Agent 正在分析资源...');

      const matchRes = await fetch('/api/agent/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!matchRes.ok) throw new Error('匹配请求失败');

      const matchData = await matchRes.json();

      setSessionId(matchData.data.sessionId);
      setOffers(matchData.data.offers);
      setSummary(matchData.data.summary);

      addLog(`✅ 匹配完成! 找到 ${matchData.data.summary.totalOffers} 个匹配`);
      addLog(`🎯 高匹配: ${matchData.data.summary.highMatches} 个`);

      // 同时保存到数据库
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          analysis: analyzeData.data.analysis,
        }),
      });

      setPhase('results');
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      addLog(`❌ 错误: ${err}`);
      setPhase('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 触发 Agent 网络匹配（用于已有需求）
  const handleMatch = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    resetNegotiation();
    setPhase('matching');
    setLogs([]);
    addLog('🌐 正在扫描 Agent 网络...');

    try {
      const matchRes = await fetch('/api/agent/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: request.content,
          budget: request.budget,
          deadline: request.deadline,
        }),
      });

      if (!matchRes.ok) throw new Error('匹配请求失败');

      const matchData = await matchRes.json();

      setSessionId(matchData.data.sessionId);
      setAnalysis(matchData.data.analysis);
      setOffers(matchData.data.offers);
      setSummary(matchData.data.summary);

      addLog(`✅ 匹配完成! 找到 ${matchData.data.summary.totalOffers} 个匹配`);
      setPhase('results');
    } catch (err) {
      console.error('Match error:', err);
      addLog(`❌ 错误: ${err}`);
      setPhase('idle');
    }
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

      {/* Agent 协商进度和结果 */}
      {phase !== 'idle' && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#8b5cf6] text-xl">{'⚡'}</span>
            <h2
              className="text-xl font-semibold tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AGENT_NEGOTIATION
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#8b5cf6]/30 to-transparent" />
            {phase === 'results' && (
              <button
                onClick={resetNegotiation}
                className="text-xs text-[#52525b] hover:text-[#00f5ff] transition-colors"
              >
                [CLOSE]
              </button>
            )}
          </div>

          {/* 处理中状态 */}
          {(phase === 'analyzing' || phase === 'matching') && (
            <div className="cyber-card p-6">
              {/* 进度指示器 */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className={`flex items-center gap-2 ${phase === 'analyzing' ? 'text-[#00f5ff]' : 'text-green-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase === 'analyzing' ? 'bg-[#00f5ff]/20 animate-pulse' : 'bg-green-500/20'}`}>
                    {phase === 'analyzing' ? '🔍' : '✓'}
                  </div>
                  <span className="text-sm">ANALYZE</span>
                </div>
                <div className="w-8 h-0.5 bg-[#00f5ff]/30" />
                <div className={`flex items-center gap-2 ${phase === 'matching' ? 'text-[#00f5ff]' : 'text-[#52525b]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase === 'matching' ? 'bg-[#00f5ff]/20 animate-pulse' : 'bg-[#52525b]/20'}`}>
                    🌐
                  </div>
                  <span className="text-sm">MATCH</span>
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

          {/* 结果展示 */}
          {phase === 'results' && summary && (
            <div className="space-y-4">
              {/* 需求分析卡片 */}
              {analysis && (
                <div className="cyber-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#ff00ff]">{'<>'}</span>
                    <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                      ANALYSIS_RESULT
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#52525b]">SUMMARY: </span>
                      <span className="text-[#e4e4e7]">{analysis.summary}</span>
                    </div>
                    <div>
                      <span className="text-[#52525b]">CATEGORY: </span>
                      <span className="text-[#00f5ff]">{analysis.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {analysis.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs border border-[#8b5cf6]/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 匹配结果 */}
              <MatchResults
                offers={offers}
                summary={summary}
                sessionId={sessionId}
                onAccept={(id) => {
                  setOffers(offers.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
                }}
                onReject={(id) => {
                  setOffers(offers.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
                }}
              />
            </div>
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
          <RequestList requests={requests} onMatch={handleMatch} />
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
