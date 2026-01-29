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
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#00f5ff]/10 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#00f5ff] flex items-center justify-center">
              <span className="text-[#00f5ff] font-bold" style={{ fontFamily: 'var(--font-display)' }}>S</span>
            </div>
            <div>
              <span className="text-[#a1a1aa] text-sm tracking-widest uppercase">SecondMe</span>
              <span className="text-[#52525b] text-xs ml-2">/ DASHBOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Marketplace Link */}
            <a
              href="/marketplace"
              className="px-4 py-2 border border-[#ff00ff] text-[#ff00ff] text-xs tracking-wider uppercase hover:bg-[#ff00ff]/10 transition-colors"
            >
              MARKETPLACE
            </a>

            {/* Status */}
            <div className="flex items-center gap-2 text-xs text-[#52525b]">
              <span className="w-2 h-2 bg-[#00f5ff] rounded-full pulse-glow" />
              <span>CONNECTED</span>
            </div>

            {/* Logout */}
            <a
              href="/api/auth/logout"
              className="px-4 py-2 border border-[#52525b] text-[#a1a1aa] text-xs tracking-wider uppercase hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors"
            >
              DISCONNECT
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <UserProfile user={userInfo} shades={userShades} />

        {/* Agent Network Section */}
        <div className="mt-10">
          <DashboardClient />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#00f5ff]/10 py-6 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-[#52525b]">
          <div className="flex items-center gap-4">
            <span>SESSION ACTIVE</span>
            <span className="w-1 h-1 bg-[#52525b] rounded-full" />
            <span>TOKEN VALID</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PROTOCOL v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
