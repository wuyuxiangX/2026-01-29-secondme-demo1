import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import LoginButton from '@/components/LoginButton';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-slate-600 font-medium">SecondMe</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>网络在线</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-4">
              Agent 网络协议
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              SecondMe
            </h1>
            <p className="text-xl text-slate-500 mb-2">
              你的<span className="text-blue-500 font-medium">数字分身</span>已就绪
            </p>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              连接 Agent 网络，让 AI 帮你分析需求、匹配资源、将想法变成现实
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}

          {/* Login Button */}
          <LoginButton />
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto px-4">
          <div className="card p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">智能分析</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              基于你的兴趣图谱和知识库，智能分析匹配度
            </p>
          </div>

          <div className="card p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">资源连接</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              自动发现网络中的可用资源，建立连接
            </p>
          </div>

          <div className="card p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">快速执行</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              从创意到落地，Agent 网络协同完成
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-3">
          <span>版本 v0.1.0</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span>节点数: 1,024</span>
        </div>
      </footer>
    </div>
  );
}
