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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动消息（只在容器内滚动，不影响页面）
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
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
    <div className="card overflow-hidden flex flex-col h-80 md:h-[400px]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {conversation.targetUserAvatar ? (
            <img
              src={conversation.targetUserAvatar}
              alt={conversation.targetUserName}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm text-blue-500 font-medium">
                {conversation.targetUserName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-slate-900">
            {conversation.targetUserName}
          </span>
        </div>
        <span className={`tag text-xs ${isCompleted ? 'tag-success' : 'tag-primary'}`}>
          {isCompleted ? '已完成' : '进行中'}
        </span>
      </div>

      {/* 消息区域 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin bg-slate-50">
        {conversation.messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} userName={conversation.targetUserName} />
        ))}
        {sending && (
          <div className="flex justify-end">
            <div className="message-agent rounded-lg px-3 py-2 max-w-[80%]">
              <div className="typing-indicator flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      {!isCompleted ? (
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={sending}
              className="input flex-1 py-2 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="btn btn-primary py-2 px-4 text-sm disabled:opacity-50"
            >
              {sending ? '...' : '发送'}
            </button>
          </div>
          <button
            onClick={handleComplete}
            className="w-full py-2 text-xs text-slate-400 hover:text-green-500 border border-transparent hover:border-green-200 rounded-lg transition-all"
          >
            标记完成
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100">
          <div className="text-center text-xs text-green-500 py-2">
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
        className={`rounded-2xl px-4 py-2 max-w-[90%] md:max-w-[75%] ${
          isRequester
            ? 'bg-white border border-slate-200 rounded-bl-sm'
            : 'bg-blue-500 text-white rounded-br-sm'
        }`}
      >
        <div className={`text-xs mb-1 ${isRequester ? 'text-slate-400' : 'text-blue-100'}`}>
          {isRequester ? '需求方' : userName}
        </div>
        <div className={`text-sm whitespace-pre-wrap break-words ${isRequester ? 'text-slate-700' : 'text-white'}`}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

export default ConversationThread;
