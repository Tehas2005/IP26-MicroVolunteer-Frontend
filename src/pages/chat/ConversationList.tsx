import { MessageCircle } from 'lucide-react';
import type { Conversation } from './types';

function formatTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return 'acum';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffMin < 1440) return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  return 'Ieri';
}

interface Props {
  conversations: Conversation[];
  selectedUsername?: string;
  onSelect: (username: string) => void;
}

export function ConversationList({ conversations, selectedUsername, onSelect }: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-brand-gray/60 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-black">Conversații</h2>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <MessageCircle className="h-10 w-10 text-brand-gray" />
          <p className="text-sm text-brand-gray-text">Nicio conversație încă.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-brand-gray/40">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.username)}
              className={[
                'flex w-full items-center gap-3 px-6 py-3 text-left transition-colors',
                selectedUsername === conv.username
                  ? 'bg-brand-purple/10'
                  : 'hover:bg-brand-cream',
              ].join(' ')}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-sm font-semibold text-brand-purple">
                {conv.username[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={[
                      'truncate text-sm text-brand-black',
                      conv.unread > 0 ? 'font-bold' : 'font-semibold',
                    ].join(' ')}
                  >
                    {conv.username}
                  </p>
                  <span className="shrink-0 text-[11px] text-brand-gray-text">
                    {formatTime(conv.timestamp)}
                  </span>
                </div>
                <p
                  className={[
                    'truncate text-xs',
                    conv.unread > 0 ? 'font-medium text-brand-black' : 'text-brand-gray-text',
                  ].join(' ')}
                >
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple text-[10px] font-semibold text-white">
                  {conv.unread > 9 ? '9+' : conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
