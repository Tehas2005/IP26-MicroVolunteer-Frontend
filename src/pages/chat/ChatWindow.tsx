import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import {
  appendMockMessage,
  getMockConversationThread,
  resolveChatViewerIdentity,
  skipMockConversationRating,
  submitMockConversationRating,
  subscribeToMockChat,
} from '@/lib/mockChat'
import { useAuthStore } from '@/store/authStore'

import { ChatInput } from './ChatInput'
import { ConversationRatingModal } from './ConversationRatingModal'
import { MessageBubble } from './MessageBubble'
import type { ConversationStatus, Message, MessageContent } from './types'

interface Props {
  username: string
  conversationId: string
  status?: ConversationStatus
}

export function ChatWindow({ username, conversationId, status = 'open' }: Props) {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)
  const identity = useMemo(() => resolveChatViewerIdentity(user), [user])
  const [messages, setMessages] = useState<Message[]>([])
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [ratingTargetName, setRatingTargetName] = useState('')
  const [viewerRole, setViewerRole] = useState<'requester' | 'volunteer'>('requester')
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  useEffect(() => {
    const refreshConversation = () => {
      const thread = getMockConversationThread(conversationId, identity)

      setMessages(thread?.messages ?? [])
      setTargetUserId(thread?.ratingPrompt?.targetUserId ?? null)
      setRatingTargetName(thread?.ratingPrompt?.targetName ?? '')
      setViewerRole(thread?.ratingPrompt?.viewerRole ?? 'requester')
      setIsRatingModalOpen(Boolean(thread?.ratingPrompt?.shouldPrompt))
    }

    refreshConversation()
    return subscribeToMockChat(refreshConversation)
  }, [conversationId, identity])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(content: MessageContent) {
    const thread = appendMockMessage(conversationId, content, identity)
    setMessages(thread?.messages ?? [])
  }

  function handleRatingSubmit(stars: number, ratingTargetUserId: string) {
    const result = submitMockConversationRating(conversationId, stars, identity)

    if (!result || result.targetUserId !== ratingTargetUserId) {
      return
    }

    setIsRatingModalOpen(false)
  }

  function handleRatingSkip() {
    const skipped = skipMockConversationRating(conversationId, identity)

    if (!skipped) {
      return
    }

    setIsRatingModalOpen(false)
  }

  const trimmedUsername = username.trim()
  const initial = trimmedUsername ? trimmedUsername[0].toUpperCase() : '?'
  const displayUsername = trimmedUsername || 'Conversatie'

  return (
    <>
      <ConversationRatingModal
        isOpen={isRatingModalOpen}
        targetName={ratingTargetName}
        targetUserId={targetUserId}
        viewerRole={viewerRole}
        onSkip={handleRatingSkip}
        onSubmit={handleRatingSubmit}
      />

      <div className="flex shrink-0 items-center gap-3 border-b border-brand-gray/60 px-6 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          aria-label="Inapoi la conversatii"
          className="shrink-0 text-brand-gray-text transition-colors hover:text-brand-black md:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-sm font-semibold text-brand-purple">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-brand-black">
            {displayUsername}
          </p>
          <p className="text-xs text-brand-gray-text">Online</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-brand-cream px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-1.5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} conversationClosed={status === 'closed'} />
    </>
  )
}
