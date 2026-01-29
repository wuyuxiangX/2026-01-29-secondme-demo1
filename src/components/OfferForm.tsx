'use client';

import { useState, FormEvent } from 'react';

interface OfferFormProps {
  requestId: string;
  onSubmit: (data: OfferFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface OfferFormData {
  requestId: string;
  content: string;
  resource?: {
    type: string;
    name: string;
    terms?: string;
  };
}

const RESOURCE_TYPES = ['物品', '场地', '设备', '服务', '技能', '其他'];

export default function OfferForm({ requestId, onSubmit, onCancel, isLoading = false }: OfferFormProps) {
  const [content, setContent] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceTerms, setResourceTerms] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('OFFER_CONTENT_REQUIRED');
      return;
    }

    try {
      const formData: OfferFormData = {
        requestId,
        content: content.trim(),
      };

      if (resourceType && resourceName) {
        formData.resource = {
          type: resourceType,
          name: resourceName.trim(),
          terms: resourceTerms.trim() || undefined,
        };
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
    }
  };

  return (
    <div className="border border-[#00f5ff]/30 bg-[#0a0a0f]/80 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#00f5ff]">{'>'}</span>
        <span className="text-sm text-[#a1a1aa] tracking-wider">CREATE_OFFER</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content */}
        <div className="space-y-2">
          <label className="block text-xs text-[#52525b] tracking-wider uppercase">
            Offer_Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="// 描述你能提供什么... 例如：我可以提供场地，免费使用"
            className="w-full h-24 px-4 py-3 bg-[#0a0a0f]/50 border border-[#27272a] text-[#e4e4e7] placeholder-[#52525b] font-mono text-sm resize-none focus:outline-none focus:border-[#00f5ff] transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Resource Section */}
        <div className="space-y-3">
          <label className="block text-xs text-[#52525b] tracking-wider uppercase">
            Resource_Details (Optional)
          </label>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Resource Type */}
            <div>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0f]/50 border border-[#27272a] text-[#e4e4e7] text-sm focus:outline-none focus:border-[#00f5ff] transition-colors"
                disabled={isLoading}
              >
                <option value="">选择类型...</option>
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Resource Name */}
            <div>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="资源名称"
                className="w-full px-3 py-2 bg-[#0a0a0f]/50 border border-[#27272a] text-[#e4e4e7] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#00f5ff] transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Resource Terms */}
            <div>
              <input
                type="text"
                value={resourceTerms}
                onChange={(e) => setResourceTerms(e.target.value)}
                placeholder="条件 (可选)"
                className="w-full px-3 py-2 bg-[#0a0a0f]/50 border border-[#27272a] text-[#e4e4e7] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#00f5ff] transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-3 py-2 border border-[#ff00ff]/50 bg-[#ff00ff]/10 text-[#ff00ff] text-xs font-mono">
            [ ERROR ] {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 border border-[#00f5ff] text-[#00f5ff] text-sm hover:bg-[#00f5ff]/10 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'SENDING...' : 'SEND_OFFER'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-[#52525b] text-[#52525b] text-sm hover:border-[#a1a1aa] hover:text-[#a1a1aa] transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
