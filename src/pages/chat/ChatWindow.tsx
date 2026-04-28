import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { Message, MessageContent } from './types';

let _idSeed = 10;
function nextId(): string {
  return String(++_idSeed);
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'them',
    content: { type: 'text', text: 'Bună! Cu ce te pot ajuta astăzi?' },
    timestamp: new Date(Date.now() - 5 * 60_000),
  },
  {
    id: '2',
    from: 'me',
    content: { type: 'text', text: 'Salut! Aș vrea să discut despre cererea mea.' },
    timestamp: new Date(Date.now() - 4 * 60_000),
  },
  {
    id: '3',
    from: 'them',
    content: { type: 'audio', url: '', durationSec: 8 },
    timestamp: new Date(Date.now() - 3 * 60_000),
  },
];

interface Props {
  username: string;
}

export function ChatWindow({ username }: Props) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
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
      <div className="flex-1 overflow-y-auto bg-brand-cream px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-1.5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </>
  );
}
