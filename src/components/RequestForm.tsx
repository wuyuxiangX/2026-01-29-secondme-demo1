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
      setError('请输入需求内容');
      return;
    }

    try {
      await onSubmit({
        content: content.trim(),
      });
      // 成功后清空表单
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    }
  };

  return (
    <div className="card p-6">
      <h3 className="font-medium text-slate-900 mb-4">发布新需求</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 内容输入 */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">
            需求描述
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入你的需求... 例如：我想办一场户外电影之夜，邀请朋友来。我什么都没有，预算 200 块。"
            className="input h-32 resize-none"
            disabled={isLoading}
          />
        </div>

        {/* 错误消息 */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 loading" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              分析中...
            </span>
          ) : (
            '广播需求'
          )}
        </button>

        {/* 帮助文字 */}
        <p className="text-center text-xs text-slate-400">
          你的需求将被 AI 分析，并广播到 Agent 网络
        </p>
      </form>
    </div>
  );
}
