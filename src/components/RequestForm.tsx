'use client';

import { useState, FormEvent } from 'react';

interface RequestFormProps {
  onSubmit: (data: RequestFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface RequestFormData {
  content: string;
}

export default function RequestForm({ onSubmit, isLoading = false }: RequestFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('REQUEST_CONTENT_REQUIRED');
      return;
    }

    try {
      await onSubmit({
        content: content.trim(),
      });
      // 成功后清空表单
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
    }
  };

  return (
    <div className="cyber-card corner-decoration p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#00f5ff] text-lg">{'>'}</span>
        <h3
          className="text-lg font-semibold tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          NEW_REQUEST
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[#00f5ff]/30 to-transparent" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Input */}
        <div className="space-y-2">
          <label className="block text-xs text-[#52525b] tracking-wider uppercase">
            Request_Description
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="// 输入你的需求... 例如：我想办一场户外电影之夜，邀请朋友来。我什么都没有，预算 200 块。"
            className="w-full h-32 px-4 py-3 bg-[#0a0a0f]/50 border border-[#27272a] text-[#e4e4e7] placeholder-[#52525b] font-mono text-sm resize-none focus:outline-none focus:border-[#00f5ff] transition-colors"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 border border-[#ff00ff]/50 bg-[#ff00ff]/10 text-[#ff00ff] text-sm font-mono">
            [ ERROR ] {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full px-8 py-4 border-2 border-[#00f5ff] text-[#00f5ff] font-bold tracking-wider transition-all duration-300 hover:bg-[#00f5ff]/10 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-display)',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <span className="animate-pulse">ANALYZING</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                <span>BROADCAST_REQUEST</span>
                <span className="group-hover:translate-x-1 transition-transform">{'>'}</span>
              </>
            )}
          </span>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f5ff]/20 to-transparent" />
          </div>
        </button>

        {/* Helper text */}
        <p className="text-center text-xs text-[#52525b]">
          // 你的需求将被 AI 分析，并广播到 Agent 网络
        </p>
      </form>
    </div>
  );
}
