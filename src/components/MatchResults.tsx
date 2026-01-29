'use client';

import { useState } from 'react';

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

interface MatchResultsProps {
  offers: MatchOffer[];
  summary: MatchSummary;
  sessionId: string;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
}

// 资源类型图标
const resourceIcons: Record<string, string> = {
  venue: '🏠',
  equipment: '🔧',
  item: '📦',
  service: '🛠️',
  skill: '💡',
  other: '✨',
};

// 得分颜色
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/20 border-green-500/50';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
  return 'bg-red-500/20 border-red-500/50';
}

export default function MatchResults({
  offers,
  summary,
  sessionId,
  onAccept,
  onReject,
}: MatchResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (offerId: string) => {
    setProcessingId(offerId);
    try {
      const res = await fetch('/api/agent/offer/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, offerId }),
      });
      if (res.ok) {
        onAccept?.(offerId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (offerId: string) => {
    setProcessingId(offerId);
    try {
      const res = await fetch('/api/agent/offer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, offerId }),
      });
      if (res.ok) {
        onReject?.(offerId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 匹配摘要 */}
      <div className="cyber-card p-4">
        <h3 className="text-lg font-bold neon-text mb-3">匹配摘要</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{summary.totalOffers}</div>
            <div className="text-gray-400">总匹配</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{summary.highMatches}</div>
            <div className="text-gray-400">高匹配</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{summary.mediumMatches}</div>
            <div className="text-gray-400">中匹配</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{summary.lowMatches}</div>
            <div className="text-gray-400">低匹配</div>
          </div>
        </div>

        {/* 需求覆盖情况 */}
        {(summary.fulfilled.length > 0 || summary.unfulfilled.length > 0) && (
          <div className="mt-4 pt-4 border-t border-cyan-500/20">
            <div className="flex flex-wrap gap-2">
              {summary.fulfilled.map((item, i) => (
                <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  ✓ {item}
                </span>
              ))}
              {summary.unfulfilled.map((item, i) => (
                <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                  ✗ {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offer 列表 */}
      <div className="space-y-4">
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className={`cyber-card overflow-hidden transition-all ${
              expandedId === offer.id ? 'ring-2 ring-cyan-500/50' : ''
            }`}
          >
            {/* 头部 */}
            <div
              className="p-4 cursor-pointer hover:bg-cyan-500/5"
              onClick={() => setExpandedId(expandedId === offer.id ? null : offer.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* 排名 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getScoreBg(offer.score)}`}>
                    #{index + 1}
                  </div>

                  {/* 用户和资源 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{resourceIcons[offer.resource.type] || '✨'}</span>
                      <span className="font-bold text-white">{offer.userName}</span>
                    </div>
                    <div className="text-cyan-400">{offer.content}</div>
                  </div>
                </div>

                {/* 得分 */}
                <div className={`text-2xl font-bold ${getScoreColor(offer.score)}`}>
                  {offer.score}
                </div>
              </div>

              {/* 亮点标签 */}
              {offer.highlights.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {offer.highlights.slice(0, 3).map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 展开详情 */}
            {expandedId === offer.id && (
              <div className="border-t border-cyan-500/20 p-4 bg-black/30">
                {/* 资源详情 */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">资源详情</h4>
                  <div className="bg-black/50 rounded p-3">
                    <div className="font-bold text-white">{offer.resource.name}</div>
                    <div className="text-sm text-gray-300">{offer.resource.description}</div>
                    {offer.resource.terms && (
                      <div className="text-sm text-cyan-400 mt-1">条件: {offer.resource.terms}</div>
                    )}
                  </div>
                </div>

                {/* 匹配理由 */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">Agent 分析</h4>
                  <div className="text-sm text-gray-300">{offer.reasoning}</div>
                </div>

                {/* 评分明细 */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">评分明细</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="text-cyan-400 font-bold">{offer.breakdown.relevance}</div>
                      <div className="text-gray-500 text-xs">相关性</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">{offer.breakdown.availability}</div>
                      <div className="text-gray-500 text-xs">可用性</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">{offer.breakdown.value}</div>
                      <div className="text-gray-500 text-xs">价值</div>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold">{offer.breakdown.userFit}</div>
                      <div className="text-gray-500 text-xs">匹配度</div>
                    </div>
                  </div>
                </div>

                {/* 顾虑 */}
                {offer.concerns.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm text-gray-400 mb-2">注意事项</h4>
                    <ul className="text-sm text-yellow-400 list-disc list-inside">
                      {offer.concerns.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4 border-t border-cyan-500/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(offer.id);
                    }}
                    disabled={processingId === offer.id || offer.status !== 'pending'}
                    className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/50 transition-all disabled:opacity-50"
                  >
                    {offer.status === 'accepted' ? '✓ 已接受' : '接受 Offer'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(offer.id);
                    }}
                    disabled={processingId === offer.id || offer.status !== 'pending'}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/50 transition-all disabled:opacity-50"
                  >
                    {offer.status === 'rejected' ? '✗ 已拒绝' : '拒绝'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="cyber-card p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-gray-400">暂无匹配结果</div>
        </div>
      )}
    </div>
  );
}
