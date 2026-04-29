import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { ConversationStatus, Message, MessageContent } from './types';

let _idSeed = 10;
function nextId(): string {
  return String(++_idSeed);
}


interface Props {
  username: string;
  status?: ConversationStatus;
}

export function ChatWindow({ username, status = 'open' }: Props) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(content: MessageContent) {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: 'me', content, timestamp: new Date() },
    ]);
  }

  const initial = username[0].toUpperCase();

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-brand-gray/60 px-6 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          aria-label="Înapoi la conversații"
          className="shrink-0 text-brand-gray-text transition-colors hover:text-brand-black md:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-sm font-semibold text-brand-purple">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-brand-black">{username}</p>
          <p className="text-xs text-brand-gray-text">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-brand-cream px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-1.5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} conversationClosed={status === 'closed'} />
    </>
  );
}
