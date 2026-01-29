'use client';

import { useState, useEffect, useCallback } from 'react';
import RequestForm, { RequestFormData } from './RequestForm';
import RequestList from './RequestList';

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

export default function DashboardClient() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 提交新需求
  const handleSubmit = async (formData: RequestFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      // 刷新列表
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 触发 Agent 网络匹配
  const handleMatch = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/match`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to match request');
      }

      // 刷新列表
      await fetchRequests();
    } catch (err) {
      console.error('Match error:', err);
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
              <span className="text-[#8b5cf6]">5</span> AGENTS ONLINE
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
