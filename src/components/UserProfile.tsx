import Image from 'next/image';
import { UserInfo, UserShade } from '@/lib/secondme';

interface UserProfileProps {
  user: UserInfo | null;
  shades: UserShade[] | null;
}

export default function UserProfile({ user, shades }: UserProfileProps) {
  if (!user) {
    return (
      <div className="cyber-card p-8 text-center">
        <p className="text-[#ff00ff]">[ ERROR ] UNABLE TO LOAD USER DATA</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Identity Card */}
      <div className="cyber-card corner-decoration p-8">
        <div className="flex items-start gap-8">
          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <div className="relative">
                <Image
                  src={user.avatar}
                  alt={user.name || 'User avatar'}
                  width={100}
                  height={100}
                  unoptimized
                  className="w-24 h-24 object-cover"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                  }}
                />
                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f5ff]" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f5ff]" />
              </div>
            ) : (
              <div
                className="w-24 h-24 bg-gradient-to-br from-[#00f5ff]/20 to-[#ff00ff]/20 flex items-center justify-center border border-[#00f5ff]/30"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                }}
              >
                <span className="text-4xl text-[#00f5ff]" style={{ fontFamily: 'var(--font-display)' }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0a0a0f] flex items-center justify-center">
              <span className="w-2 h-2 bg-[#00f5ff] rounded-full pulse-glow" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2
                className="text-2xl font-bold tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {user.name || 'UNKNOWN_USER'}
              </h2>
              <span className="px-2 py-0.5 border border-[#00f5ff]/50 text-[#00f5ff] text-xs tracking-wider">
                VERIFIED
              </span>
            </div>

            {user.email && (
              <p className="text-[#a1a1aa] text-sm mb-3">{user.email}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-[#52525b]">
              {(user.id || user.openId) && (
              <div className="flex items-center gap-2">
                <span className="text-[#00f5ff]">ID:</span>
                <span className="font-mono">{(user.id || user.openId)?.slice(0, 12)}...</span>
              </div>
              )}
              <span className="w-1 h-1 bg-[#52525b] rounded-full" />
              <span>AGENT_STATUS: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shades (Interests) */}
      <div className="cyber-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#00f5ff] text-lg">{'#'}</span>
          <h3
            className="text-lg font-semibold tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            INTEREST_SHADES
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-[#00f5ff]/30 to-transparent" />
        </div>

        {shades && shades.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {shades.map((shade, index) => (
              <span
                key={shade.id}
                className="group relative px-4 py-2 border text-sm tracking-wide transition-all duration-300 cursor-default"
                style={{
                  borderColor: index % 3 === 0 ? '#00f5ff' : index % 3 === 1 ? '#ff00ff' : '#8b5cf6',
                  color: index % 3 === 0 ? '#00f5ff' : index % 3 === 1 ? '#ff00ff' : '#8b5cf6',
                }}
                title={shade.description}
              >
                <span className="relative z-10">{shade.name}</span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{
                    background: index % 3 === 0 ? '#00f5ff' : index % 3 === 1 ? '#ff00ff' : '#8b5cf6',
                  }}
                />
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[#52525b]">[ NO SHADES DETECTED ]</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#52525b] text-xs tracking-wider">REQUESTS</span>
            <span className="text-[#00f5ff] text-xs">{'<>'}</span>
          </div>
          <div
            className="text-4xl font-bold text-[#e4e4e7]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            0
          </div>
          <div className="mt-2 h-px bg-gradient-to-r from-[#00f5ff]/50 to-transparent" />
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#52525b] text-xs tracking-wider">OFFERS</span>
            <span className="text-[#ff00ff] text-xs">{'{}'}</span>
          </div>
          <div
            className="text-4xl font-bold text-[#e4e4e7]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            0
          </div>
          <div className="mt-2 h-px bg-gradient-to-r from-[#ff00ff]/50 to-transparent" />
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#52525b] text-xs tracking-wider">MATCHES</span>
            <span className="text-[#8b5cf6] text-xs">{'>>'}</span>
          </div>
          <div
            className="text-4xl font-bold text-[#e4e4e7]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            0
          </div>
          <div className="mt-2 h-px bg-gradient-to-r from-[#8b5cf6]/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
