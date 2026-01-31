'use client';

import { SummaryCardProps } from './types';

export function SummaryCard({ summary, totalCount, completedCount }: SummaryCardProps) {
  return (
    <div className="card p-4 md:p-6 border-purple-100 bg-purple-50/50">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-purple-700">
          网络对话总结
        </h3>
      </div>

      {/* 统计信息 */}
      <div className="flex flex-wrap gap-3 md:gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">对话总数:</span>
          <span className="text-blue-500 font-medium">{totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">已完成:</span>
          <span className="text-green-500 font-medium">{completedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">进行中:</span>
          <span className="text-purple-500 font-medium">{totalCount - completedCount}</span>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-purple-200/50 my-4" />

      {/* 总结内容 */}
      <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  );
}

export default SummaryCard;
