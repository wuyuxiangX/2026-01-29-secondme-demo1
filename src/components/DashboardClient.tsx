'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RequestForm, { RequestFormData } from './RequestForm';
import RequestList from './RequestList';
import NetworkConversation from './NetworkConversation';

interface Request {
  id: string;
  content: string;
  summary?: string;
  status: string;
  conversations: Array<{
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
  }>;
  conversationCount: number;
  createdAt: string;
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
      addLog('正在广播您的需求到网络...');
      addLog('正在寻找网络中的用户...');

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

      addLog(`广播完成！找到 ${broadcastData.data.totalUsers} 个用户`);
      addLog(`成功对话: ${broadcastData.data.successCount} 个`);

      if (broadcastData.data.conversations) {
        for (const conv of broadcastData.data.conversations) {
          addLog(`${conv.userName}: ${conv.firstReply.slice(0, 50)}...`);
        }
      }

      setCurrentRequestId(broadcastData.data.requestId);
      setPhase('chatting');
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      addLog(`错误: ${err}`);
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
    <div className="space-y-6">
      {/* 发布需求 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">广播需求</h2>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <RequestForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </section>

      {/* 网络对话进度和结果 */}
      {phase !== 'idle' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">网络对话</h2>
            {(phase === 'chatting' || phase === 'completed') && (
              <button
                onClick={resetConversation}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                关闭
              </button>
            )}
          </div>

          {/* 广播中状态 */}
          {phase === 'broadcasting' && (
            <div className="card p-6">
              {/* 进度指示器 */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-blue-500">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 pulse">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  </div>
                  <span className="text-sm">广播中</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-200" />
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-sm">对话</span>
                </div>
              </div>

              {/* 日志窗口 */}
              <div className="bg-slate-50 rounded-lg p-4 h-48 overflow-y-auto text-sm border border-slate-100">
                {logs.map((log, i) => (
                  <div key={i} className="text-slate-600 mb-1">{log}</div>
                ))}
                <div ref={logsEndRef} />
                <div className="text-blue-500 pulse">...</div>
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

      {/* 需求列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">我的需求</h2>
          {requests.length > 0 && (
            <span className="text-sm text-slate-400">
              共 {requests.length} 条
            </span>
          )}
        </div>

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
        ) : (
          <RequestList requests={requests} onViewConversation={handleViewConversations} />
        )}
      </section>

      {/* 网络状态 */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse"></span>
            <span className="text-sm text-slate-500">Agent 网络状态</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span><span className="text-blue-500 font-medium">{requests.length}</span> 需求</span>
            <span><span className="text-purple-500 font-medium">{requests.reduce((acc, r) => acc + (r.conversationCount || 0), 0)}</span> 对话</span>
            <span><span className="text-green-500 font-medium">6</span> 在线</span>
          </div>
        </div>
      </section>
    </div>
  );
}
