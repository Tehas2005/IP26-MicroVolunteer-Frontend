import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { ConversationList } from './chat/ConversationList';
import { ChatWindow } from './chat/ChatWindow';
import type { Conversation } from './chat/types';

// Conversations are populated from account data — empty by default.
const conversations: Conversation[] = [];

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <MessageCircle className="h-12 w-12 text-brand-gray" />
      <p className="text-sm font-medium text-brand-gray-text">Selectează o conversație</p>
    </div>
  );
}

export function ChatPage() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-3 flex justify-start">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-brand-gray-text transition-colors hover:text-brand-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden rounded-[52px] border border-brand-gray/80 bg-white">

        {/* Left panel — hidden on mobile when a conversation is open */}
        <div
          className={[
            'flex-col border-r border-brand-gray/60',
            username ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80',
          ].join(' ')}
        >
          <ConversationList
            conversations={conversations}
            selectedUsername={username}
            onSelect={(u) => navigate(`/chat/${u}`)}
          />
        </div>

        {/* Right panel — hidden on mobile when no conversation is selected */}
        <div
          className={[
            'flex-1 flex-col',
            username ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
          {username ? <ChatWindow username={username} /> : <EmptyState />}
        </div>

      </div>
    </div>
  );
}

export default ChatPage;
