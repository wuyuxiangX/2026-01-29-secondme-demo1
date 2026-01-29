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
    <div className="relative min-h-screen flex flex-col">
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00f5ff] rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00f5ff] flex items-center justify-center">
            <span className="text-[#00f5ff] font-bold" style={{ fontFamily: 'var(--font-display)' }}>S</span>
          </div>
          <span className="text-[#a1a1aa] text-sm tracking-widest uppercase">SecondMe</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#52525b]">
          <span className="w-2 h-2 bg-[#00f5ff] rounded-full pulse-glow" />
          <span>NETWORK ONLINE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Glitch Title */}
          <div className="mb-6">
            <p className="text-[#00f5ff] text-sm tracking-[0.3em] uppercase mb-4 opacity-70">
              [ AGENT NETWORK PROTOCOL ]
            </p>
            <h1
              className="text-5xl md:text-7xl font-black tracking-tight glitch"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-[#e4e4e7]">SECOND</span>
              <span className="text-[#00f5ff] neon-text">ME</span>
            </h1>
          </div>

          {/* Subtitle with typing effect */}
          <p className="text-xl md:text-2xl text-[#a1a1aa] mb-4 tracking-wide">
            你的<span className="text-[#ff00ff] neon-text-magenta">数字分身</span>已就绪
          </p>
          <p className="text-[#52525b] max-w-lg mx-auto mb-12 leading-relaxed">
            连接 Agent 网络，让 AI 帮你分析需求、匹配资源、<br />
            将想法变成现实
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-8 px-6 py-3 border border-[#ff00ff] bg-[#ff00ff]/10 text-[#ff00ff] text-sm inline-block">
              <span className="mr-2">[ ERROR ]</span>
              {decodeURIComponent(error)}
            </div>
          )}

          {/* Login Button */}
          <LoginButton />
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
          <div className="cyber-card corner-decoration p-6 group">
            <div className="text-[#00f5ff] text-3xl mb-4 group-hover:neon-text transition-all">
              {'</>'}
            </div>
            <h3 className="text-lg font-semibold mb-2 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              AGENT 分析
            </h3>
            <p className="text-sm text-[#52525b] leading-relaxed">
              基于你的兴趣图谱和知识库，智能分析匹配度
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-[#00f5ff]/50 to-transparent" />
          </div>

          <div className="cyber-card corner-decoration p-6 group">
            <div className="text-[#ff00ff] text-3xl mb-4 group-hover:neon-text-magenta transition-all">
              {'{ }'}
            </div>
            <h3 className="text-lg font-semibold mb-2 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              资源连接
            </h3>
            <p className="text-sm text-[#52525b] leading-relaxed">
              自动发现网络中的可用资源，建立连接
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-[#ff00ff]/50 to-transparent" />
          </div>

          <div className="cyber-card corner-decoration p-6 group">
            <div className="text-[#8b5cf6] text-3xl mb-4 group-hover:text-shadow-purple transition-all">
              {'>>'}
            </div>
            <h3 className="text-lg font-semibold mb-2 tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              想法执行
            </h3>
            <p className="text-sm text-[#52525b] leading-relaxed">
              从创意到落地，Agent 网络协同完成
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-[#8b5cf6]/50 to-transparent" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-xs text-[#52525b]">
        <div className="flex items-center justify-center gap-4">
          <span>PROTOCOL v0.1.0</span>
          <span className="w-1 h-1 bg-[#52525b] rounded-full" />
          <span>NODES: 1,024</span>
          <span className="w-1 h-1 bg-[#52525b] rounded-full" />
          <span>LATENCY: 12ms</span>
        </div>
      </footer>
    </div>
  );
}
