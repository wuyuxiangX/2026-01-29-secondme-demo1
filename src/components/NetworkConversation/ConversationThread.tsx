'use client';

import { useState, useRef, useEffect } from 'react';
import { ConversationThreadProps, Message } from './types';

export function ConversationThread({
  conversation,
  onSendMessage,
  onComplete,
  isSending = false,
}: ConversationThreadProps) {
  const [message, setMessage] = useState('');
  const [isLocalSending, setIsLocalSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = async () => {
    if (!message.trim() || isLocalSending || isSending) return;

    setIsLocalSending(true);
    try {
      await onSendMessage(conversation.id, message.trim());
      setMessage('');
    } finally {
      setIsLocalSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleComplete = async () => {
    await onComplete(conversation.id);
  };

  const isCompleted = conversation.status === 'completed';
  const sending = isLocalSending || isSending;

  return (
    <div className="cyber-card rounded-lg overflow-hidden flex flex-col h-[400px]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-[#00f5ff]/20">
        <div className="flex items-center gap-2">
          {conversation.targetUserAvatar ? (
            <img
              src={conversation.targetUserAvatar}
              alt={conversation.targetUserName}
              className="w-8 h-8 rounded-full border border-[#00f5ff]/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f5ff]/20 to-[#ff00ff]/20 flex items-center justify-center border border-[#00f5ff]/30">
              <span className="text-xs text-[#00f5ff]">
                {conversation.targetUserName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-[#e4e4e7]">
            {conversation.targetUserName}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            isCompleted
              ? 'bg-green-500/20 text-green-400'
              : 'bg-[#00f5ff]/20 text-[#00f5ff]'
          }`}
        >
          {isCompleted ? '已完成' : '进行中'}
        </span>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#00f5ff]/20">
        {conversation.messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} userName={conversation.targetUserName} />
        ))}
        {sending && (
          <div className="flex justify-end">
            <div className="message-agent rounded-lg px-3 py-2 max-w-[80%]">
              <div className="typing-indicator flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full" />
                <span className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full" />
                <span className="w-1.5 h-1.5 bg-[#ff00ff] rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      {!isCompleted ? (
        <div className="p-3 border-t border-[#00f5ff]/20 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={sending}
              className="flex-1 bg-[#0a0a0f] border border-[#00f5ff]/30 rounded px-3 py-2 text-sm text-[#e4e4e7] placeholder-[#52525b] focus:outline-none focus:border-[#00f5ff] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="px-4 py-2 bg-gradient-to-r from-[#00f5ff]/20 to-[#00f5ff]/10 border border-[#00f5ff]/50 rounded text-[#00f5ff] text-sm hover:bg-[#00f5ff]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? '...' : '发送'}
            </button>
          </div>
          <button
            onClick={handleComplete}
            className="w-full py-1.5 text-xs text-[#52525b] hover:text-green-400 border border-transparent hover:border-green-400/30 rounded transition-all"
          >
            标记完成
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-[#00f5ff]/20">
          <div className="text-center text-xs text-green-400/70 py-2">
            对话已完成
          </div>
        </div>
      )}
    </div>
  );
}

// 消息气泡组件
function MessageBubble({ message, userName }: { message: Message; userName: string }) {
  const isRequester = message.role === 'requester';

  return (
    <div className={`flex ${isRequester ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`rounded-lg px-3 py-2 max-w-[85%] ${
          isRequester ? 'message-requester' : 'message-agent'
        }`}
      >
        <div className="text-[10px] text-[#52525b] mb-1">
          {isRequester ? '需求方' : userName}
        </div>
        <div className="text-sm text-[#e4e4e7] whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default ConversationThread;
