import { getAccessToken, getRefreshToken, getSession } from '@/lib/session';
import { getUserInfo, getUserShades, refreshAccessToken } from '@/lib/secondme';
import { setSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserProfile from '@/components/UserProfile';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const newTokenData = await refreshAccessToken(refreshToken);
        await setSession(newTokenData);
        accessToken = newTokenData.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        redirect('/');
      }
    } else {
      redirect('/');
    }
  }

  let userInfo = null;
  let userShades = null;

  try {
    [userInfo, userShades] = await Promise.all([
      getUserInfo(accessToken),
      getUserShades(accessToken),
    ]);

    // 自动将用户加入网络（创建或更新用户记录）
    const session = await getSession();
    if (session && userInfo.email) {
      await prisma.user.upsert({
        where: { secondmeId: userInfo.email },
        update: {
          name: userInfo.name,
          avatar: userInfo.avatar,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          tokenExpiry: new Date(session.expiresAt),
        },
        create: {
          secondmeId: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          tokenExpiry: new Date(session.expiresAt),
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    redirect('/');
  }

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
              <span className="text-slate-400 text-sm">控制台</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Network Link */}
            <a
              href="/network"
              className="btn btn-secondary text-sm py-2 px-3 md:px-4"
            >
              网络成员
            </a>

            {/* Marketplace Link */}
            <a
              href="/marketplace"
              className="btn btn-secondary text-sm py-2 px-3 md:px-4"
            >
              需求市场
            </a>

            {/* Status */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>已连接</span>
            </div>

            {/* Logout */}
            <a
              href="/api/auth/logout"
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              退出
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: User Profile */}
          <div className="lg:col-span-1">
            <UserProfile user={userInfo} shades={userShades} />
          </div>

          {/* Right: Agent Network */}
          <div className="lg:col-span-2">
            <DashboardClient />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>会话活跃</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Token 有效</span>
          </div>
          <span>版本 v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
