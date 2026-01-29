'use client';

import { useState } from 'react';

interface Offer {
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
}

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
  offers: Offer[];
  createdAt: string;
}

interface RequestListProps {
  requests: Request[];
  onViewConversation?: (requestId: string) => void;
}

export default function RequestList({ requests, onViewConversation }: RequestListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleViewConversation = (requestId: string) => {
    onViewConversation?.(requestId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-[#fbbf24] border-[#fbbf24]';
      case 'matching':
        return 'text-[#00f5ff] border-[#00f5ff]';
      case 'completed':
        return 'text-[#22c55e] border-[#22c55e]';
      case 'cancelled':
        return 'text-[#52525b] border-[#52525b]';
      default:
        return 'text-[#a1a1aa] border-[#a1a1aa]';
    }
  };

  if (requests.length === 0) {
    return (
      <div className="cyber-card p-8 text-center">
        <p className="text-[#52525b]">[ NO REQUESTS FOUND ]</p>
        <p className="text-sm text-[#52525b] mt-2">// 发布你的第一个需求开始匹配</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="cyber-card corner-decoration">
          {/* Request Header */}
          <div className="p-6 border-b border-[#27272a]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 border text-xs uppercase tracking-wider ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-[#e4e4e7]">{request.content}</p>
                {request.analysis?.summary && (
                  <p className="text-sm text-[#a1a1aa] mt-2 italic">
                    // {request.analysis.summary}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                className="text-[#52525b] hover:text-[#00f5ff] transition-colors"
              >
                {expandedId === request.id ? '[-]' : '[+]'}
              </button>
            </div>

            {/* Tags */}
            {request.analysis?.suggestedTags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {request.analysis.suggestedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs border border-[#8b5cf6]/50 text-[#8b5cf6]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {expandedId === request.id && (
            <div className="p-6 border-b border-[#27272a] bg-[#0a0a0f]/50">
              <div className="text-sm">
                <span className="text-[#52525b]">CREATED: </span>
                <span className="text-[#e4e4e7] font-mono">
                  {new Date(request.createdAt).toLocaleString()}
                </span>
              </div>
              {request.analysis?.requirements && (
                <div className="mt-4">
                  <span className="text-[#52525b] text-xs tracking-wider">REQUIREMENTS:</span>
                  <ul className="mt-2 space-y-1">
                    {request.analysis.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-[#a1a1aa]">
                        {'>'} {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Offers Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#ff00ff]">{'<>'}</span>
                <span className="text-sm text-[#52525b] tracking-wider">
                  OFFERS ({request.offers.length})
                </span>
              </div>
              {onViewConversation && (
                <button
                  onClick={() => handleViewConversation(request.id)}
                  className="px-4 py-2 border border-[#8b5cf6] text-[#8b5cf6] text-sm hover:bg-[#8b5cf6]/10 transition-colors"
                >
                  VIEW_CONVERSATIONS
                </button>
              )}
            </div>

            {request.offers.length > 0 ? (
              <div className="space-y-3">
                {request.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 border border-[#27272a] hover:border-[#00f5ff]/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-[#00f5ff]/20 to-[#ff00ff]/20 flex items-center justify-center border border-[#00f5ff]/30">
                        <span className="text-[#00f5ff] text-sm">
                          {offer.user.name?.[0] || 'A'}
                        </span>
                      </div>

                      {/* Offer Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#e4e4e7] font-semibold text-sm">
                            {offer.user.name || 'Agent'}
                          </span>
                          {offer.resource && (
                            <span className="px-2 py-0.5 bg-[#00f5ff]/10 text-[#00f5ff] text-xs">
                              {offer.resource.type}
                            </span>
                          )}
                        </div>
                        <p className="text-[#e4e4e7]">{offer.content}</p>
                        {offer.reasoning && (
                          <p className="text-xs text-[#52525b] mt-1 italic">
                            // {offer.reasoning}
                          </p>
                        )}
                      </div>

                      {/* Accept Button */}
                      <button className="px-3 py-1 border border-[#22c55e] text-[#22c55e] text-xs hover:bg-[#22c55e]/10 transition-colors">
                        ACCEPT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[#52525b] text-sm">
                // 点击 SCAN_NETWORK 开始匹配
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
