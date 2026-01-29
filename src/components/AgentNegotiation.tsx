'use client';

import { useState, useRef, useEffect } from 'react';
import MatchResults from './MatchResults';

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

type Phase = 'input' | 'analyzing' | 'matching' | 'results';

export default function AgentNegotiation() {
  const [phase, setPhase] = useState<Phase>('input');
  const [request, setRequest] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [offers, setOffers] = useState<MatchOffer[]>([]);
  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSubmit = async () => {
    if (!request.trim()) {
      setError('请输入您的需求');
      return;
    }

    setError('');
    setPhase('analyzing');
    setLogs([]);

    try {
      // 阶段1：分析需求
      addLog('🔍 正在分析您的需求...');

      const analyzeRes = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: request,
          budget: budget ? parseFloat(budget) : undefined,
          deadline: deadline || undefined,
        }),
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
      addLog('🤖 小美的 Agent 正在分析资源...');

      const matchRes = await fetch('/api/agent/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: request,
          budget: budget ? parseFloat(budget) : undefined,
          deadline: deadline || undefined,
        }),
      });

      if (!matchRes.ok) throw new Error('匹配请求失败');

      const matchData = await matchRes.json();

      setSessionId(matchData.data.sessionId);
      setOffers(matchData.data.offers);
      setSummary(matchData.data.summary);

      addLog(`✅ 匹配完成! 找到 ${matchData.data.summary.totalOffers} 个匹配`);
      addLog(`🎯 高匹配: ${matchData.data.summary.highMatches} 个`);

      setPhase('results');
    } catch (err) {
      console.error(err);
      setError(String(err));
      addLog(`❌ 错误: ${err}`);
      setPhase('input');
    }
  };

  const handleReset = () => {
    setPhase('input');
    setRequest('');
    setBudget('');
    setDeadline('');
    setAnalysis(null);
    setOffers([]);
    setSummary(null);
    setLogs([]);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold neon-text">Agent 协商网络</h2>
        <p className="text-gray-400 mt-2">发布您的需求，让 AI Agent 网络为您匹配最佳资源</p>
      </div>

      {/* 输入阶段 */}
      {phase === 'input' && (
        <div className="cyber-card p-6 space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm mb-2">您想做什么？</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="例如：我想在周六办一场户外电影之夜，邀请朋友来。我什么都没有，预算 200 块。"
              className="w-full h-32 bg-black/50 border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-cyan-400 text-sm mb-2">预算（可选）</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例如: 200"
                className="w-full bg-black/50 border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-sm mb-2">时间（可选）</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="例如: 这周六"
                className="w-full bg-black/50 border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            🚀 开始匹配
          </button>
        </div>
      )}

      {/* 处理中阶段 */}
      {(phase === 'analyzing' || phase === 'matching') && (
        <div className="cyber-card p-6">
          {/* 进度指示器 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${phase === 'analyzing' ? 'text-cyan-400' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase === 'analyzing' ? 'bg-cyan-500/20 animate-pulse' : 'bg-green-500/20'}`}>
                {phase === 'analyzing' ? '🔍' : '✓'}
              </div>
              <span>分析需求</span>
            </div>
            <div className="w-8 h-0.5 bg-cyan-500/30" />
            <div className={`flex items-center gap-2 ${phase === 'matching' ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase === 'matching' ? 'bg-cyan-500/20 animate-pulse' : 'bg-gray-500/20'}`}>
                🌐
              </div>
              <span>网络匹配</span>
            </div>
          </div>

          {/* 日志窗口 */}
          <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300 mb-1">{log}</div>
            ))}
            <div ref={logsEndRef} />
            {(phase === 'analyzing' || phase === 'matching') && (
              <div className="text-cyan-400 animate-pulse">▊</div>
            )}
          </div>
        </div>
      )}

      {/* 结果阶段 */}
      {phase === 'results' && summary && (
        <>
          {/* 需求分析卡片 */}
          {analysis && (
            <div className="cyber-card p-4">
              <h3 className="text-lg font-bold neon-text-magenta mb-3">需求分析</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">摘要：</span>
                  <span className="text-white">{analysis.summary}</span>
                </div>
                <div>
                  <span className="text-gray-400">类别：</span>
                  <span className="text-cyan-400">{analysis.category}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {analysis.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
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

          {/* 重新开始按钮 */}
          <div className="text-center">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded border border-gray-500/50 transition-all"
            >
              发布新需求
            </button>
          </div>
        </>
      )}
    </div>
  );
}
