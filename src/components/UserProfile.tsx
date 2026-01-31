import Image from 'next/image';
import { UserInfo, UserShade } from '@/lib/secondme';

interface UserProfileProps {
  user: UserInfo | null;
  shades: UserShade[] | null;
}

export default function UserProfile({ user, shades }: UserProfileProps) {
  if (!user) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-500">无法加载用户数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 用户信息卡片 */}
      <div className="card p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          {/* 头像 */}
          <div className="relative">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || '用户头像'}
                width={64}
                height={64}
                unoptimized
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl text-blue-500 font-medium">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            {/* 在线指示器 */}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
          </div>

          {/* 用户信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {user.name || '未知用户'}
              </h2>
              <span className="tag tag-success">已认证</span>
            </div>

            {user.email && (
              <p className="text-slate-500 text-sm">{user.email}</p>
            )}

            {(user.id || user.openId) && (
              <p className="text-slate-400 text-xs mt-1">
                ID: {(user.id || user.openId)?.slice(0, 12)}...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 兴趣标签 */}
      <div className="card p-4 md:p-6">
        <h3 className="font-medium text-slate-900 mb-4">兴趣标签</h3>

        {shades && shades.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {shades.map((shade, index) => (
              <span
                key={shade.id}
                className={`tag ${index % 3 === 0 ? 'tag-primary' : index % 3 === 1 ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}
                title={shade.description}
              >
                {shade.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">暂无兴趣标签</p>
        )}
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">发布需求</p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">提供资源</p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">成功匹配</p>
        </div>
      </div>
    </div>
  );
}
