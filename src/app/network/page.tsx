'use client';

import { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string | null;
  avatar: string | null;
  requestCount: number;
  conversationCount: number;
  createdAt: string;
}

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/network/members');
        const data = await response.json();
        if (data.members) {
          setMembers(data.members);
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalRequests = members.reduce((acc, m) => acc + m.requestCount, 0);
  const totalConversations = members.reduce((acc, m) => acc + m.conversationCount, 0);

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
              <span className="text-slate-400 text-sm">网络成员</span>
            </div>
          </div>

          <a
            href="/dashboard"
            className="btn btn-secondary text-sm py-2 px-4"
          >
            返回控制台
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">网络成员</h1>
          <span className="text-sm text-slate-400">
            共 {members.length} 位成员
          </span>
        </div>

        {/* Members Grid */}
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
        ) : members.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">暂无成员</p>
            <p className="text-sm text-slate-400 mb-6">登录后自动加入网络</p>
            <a href="/dashboard" className="btn btn-primary">
              前往控制台
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.id} className="card p-4 md:p-5">
                {/* Member Header */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 font-semibold text-lg">
                          {member.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                  </div>

                  {/* Name and badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-900 font-medium truncate">
                        {member.name || '未命名用户'}
                      </h3>
                    </div>
                    <span className="tag tag-success text-xs mt-1">已认证</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">{member.requestCount}</div>
                    <div className="text-xs text-slate-400">发布需求</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">{member.conversationCount}</div>
                    <div className="text-xs text-slate-400">参与对话</div>
                  </div>
                </div>

                {/* Join time */}
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>加入于 {formatDate(member.createdAt)}</span>
                </div>
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
            <span>{members.length} 位成员</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{totalRequests} 条需求</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{totalConversations} 个对话</span>
          </div>
          <span>版本 v0.2.0</span>
        </div>
      </footer>
    </div>
  );
}
