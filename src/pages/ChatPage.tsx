import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'

import { ConversationList } from './chat/ConversationList'
import { useMockConversations } from './chat/hooks/useMockConversations'
import { ChatWindow } from './chat/ChatWindow'

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <MessageCircle className="h-12 w-12 text-brand-gray" />
      <p className="text-sm font-medium text-brand-gray-text">Selectează o conversație</p>
    </div>
  )
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const { conversations } = useMockConversations(authUser)

  const selectedConversation = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId) ?? null
    : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-3 flex justify-start">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-brand-gray-text transition-colors hover:text-brand-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[52px] border border-brand-gray/80 bg-white">
        <div
          className={[
            'min-h-0 flex-col overflow-hidden border-r border-brand-gray/60',
            conversationId ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80',
          ].join(' ')}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={conversationId}
            onSelect={(id) => navigate(`/chat/${id}`)}
          />
        </div>

        <div
          className={[
            'min-h-0 flex-1 flex-col overflow-hidden',
            conversationId ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              status={selectedConversation.status}
              username={selectedConversation.username}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage
