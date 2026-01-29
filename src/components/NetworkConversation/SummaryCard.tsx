'use client';

import { SummaryCardProps } from './types';

export function SummaryCard({ summary, totalCount, completedCount }: SummaryCardProps) {
  return (
    <div className="summary-highlight cyber-card rounded-lg p-6 mt-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="text-lg font-bold neon-text text-[#8b5cf6]">
          网络对话总结
        </h3>
      </div>

      {/* 统计信息 */}
      <div className="flex gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#52525b]">对话总数:</span>
          <span className="text-[#00f5ff] font-mono">{totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#52525b]">已完成:</span>
          <span className="text-green-400 font-mono">{completedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#52525b]">进行中:</span>
          <span className="text-[#ff00ff] font-mono">{totalCount - completedCount}</span>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/50 to-transparent my-4" />

      {/* 总结内容 */}
      <div className="text-[#e4e4e7] text-sm leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  );
}

export default SummaryCard;
