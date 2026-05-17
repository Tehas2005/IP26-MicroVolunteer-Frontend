import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { backend } from '@/lib/backend'
import { readGuestSessionId } from '@/lib/guestSession'
import { extractTaskPayload, readTaskHelperUserId, readTaskRequesterUserId } from '@/lib/liveRequests'
import { useAuthStore } from '@/store/authStore'

import { ConversationList } from './chat/ConversationList'
import { useBackendConversations } from './chat/hooks/useBackendConversations'
import { ChatWindow } from './chat/ChatWindow'
import type { Conversation } from './chat/types'

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
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const guestSessionId = isGuest ? readGuestSessionId() : ''
  const { conversations } = useBackendConversations()

  const fallbackConversationQuery = useQuery({
    queryKey: ['chat-conversation', conversationId, currentUserId, guestSessionId],
    enabled:
      sessionStatus === 'ready' &&
      Boolean(conversationId) &&
      Boolean(currentUserId || guestSessionId),
    queryFn: async () => {
      const response = await backend.tasks.getById(conversationId as string, {
        headers: isGuest && guestSessionId ? { 'X-Guest-Session': guestSessionId } : undefined,
      })

      if (!response.success || !response.data) {
        return null
      }

      const task = extractTaskPayload(response.data)

      if (!task) {
        return null
      }

      const requesterUserId = readTaskRequesterUserId(task)
      const helperUserId = readTaskHelperUserId(task)
      const isRequesterViewing = isGuest ? true : requesterUserId === currentUserId
      const taskStatus = typeof task.status === 'string' ? task.status.toUpperCase() : ''

      return {
        id: String(task.id),
        username: isRequesterViewing
          ? 'Voluntar'
          : task.anonymousMode
            ? 'utilizator_anonim'
            : 'Solicitant',
        lastMessage: task.title?.trim() ? `Cerere: ${task.title.trim()}` : 'Conversație task',
        timestamp: new Date(task.updatedAt ?? task.createdAt ?? Date.now()),
        unread: 0,
        status: taskStatus === 'COMPLETED' || taskStatus === 'CANCELLED' ? 'closed' : 'open',
        requestId: String(task.id),
        requestTitle: task.title?.trim() || 'Cerere fără titlu',
        targetUserId: isRequesterViewing ? helperUserId : requesterUserId,
        targetUserName: isRequesterViewing
          ? 'Voluntar'
          : task.anonymousMode
            ? 'utilizator_anonim'
          : 'Solicitant',
        viewerRole: isRequesterViewing ? 'requester' : 'volunteer',
        viewerHasRated: false,
        ratingPromptPending: false,
        viewerRating: null,
      } satisfies Conversation
    },
  })

  const selectedConversation = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId) ??
      fallbackConversationQuery.data ??
      null
    : null

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-3 shrink-0 flex justify-start">
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
            'flex min-h-0 flex-col overflow-hidden border-r border-brand-gray/60',
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
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            conversationId ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
          {selectedConversation ? (
            <ChatWindow conversation={selectedConversation} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage
