'use client';

import { useState } from 'react';

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
  summary?: string;
  status: string;
  conversations: Conversation[];
  conversationCount: number;
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'tag-warning';
      case 'matching':
        return 'tag-primary';
      case 'completed':
        return 'tag-success';
      case 'cancelled':
        return 'tag';
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
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  if (requests.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-400">暂无需求记录</p>
        <p className="text-sm text-slate-400 mt-1">发布你的第一个需求开始匹配</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="card overflow-hidden">
          {/* 需求头部 */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag ${getStatusStyle(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
                <p className="text-slate-900">{request.content}</p>
                {request.summary && (
                  <p className="text-sm text-slate-500 mt-2">
                    {request.summary}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                className="text-slate-400 hover:text-blue-500 transition-colors p-2"
              >
                <svg className={`w-5 h-5 transition-transform ${expandedId === request.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 对话数量 */}
            {request.conversationCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="tag tag-primary">
                  {request.conversationCount} 个对话
                </span>
              </div>
            )}
          </div>

          {/* 展开详情 */}
          {expandedId === request.id && (
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="text-sm text-slate-600">
                <span>创建时间：</span>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* 对话列表 */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">
                对话 ({request.conversations?.length || 0})
              </span>
              {onViewConversation && request.conversations?.length > 0 && (
                <button
                  onClick={() => handleViewConversation(request.id)}
                  className="btn btn-secondary text-sm py-1 px-3"
                >
                  查看对话
                </button>
              )}
            </div>

            {request.conversations?.length > 0 ? (
              <div className="space-y-2">
                {request.conversations.slice(0, 3).map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* 用户头像 */}
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 text-sm font-medium">
                          {conv.targetUser.name?.[0] || 'A'}
                        </span>
                      </div>

                      {/* 对话预览 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 text-sm">
                            {conv.targetUser.name || 'Agent'}
                          </span>
                          <span className={`tag text-xs ${conv.status === 'ongoing' ? 'tag-primary' : 'tag-success'}`}>
                            {conv.status === 'ongoing' ? '进行中' : '已完成'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm truncate">
                          {conv.messages[conv.messages.length - 1]?.content || '暂无消息'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {request.conversations.length > 3 && (
                  <p className="text-center text-slate-400 text-sm">
                    还有 {request.conversations.length - 3} 个对话...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center py-4 text-slate-400 text-sm">
                广播需求开始对话
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
