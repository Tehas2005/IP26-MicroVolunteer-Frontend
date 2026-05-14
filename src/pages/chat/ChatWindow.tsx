import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ChevronLeft } from 'lucide-react'

import {
  appendMockMessage,
  closeMockConversation,
  dismissMockConversationRatingPrompt,
  getMockConversationThread,
  resolveChatViewerIdentity,
  submitMockConversationRating,
  subscribeToMockChat,
} from '@/lib/mockChat'
import { useAuthStore } from '@/store/authStore'

import { ChatInput } from './ChatInput'
import { ConversationRatingModal } from './ConversationRatingModal'
import { MessageBubble } from './MessageBubble'
import type { Conversation, ConversationThread, MessageContent, RatingValue } from './types'

interface Props {
  conversation: Conversation
}

export function ChatWindow({ conversation }: Props) {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)
  const identity = useMemo(() => resolveChatViewerIdentity(user), [user])
  const [thread, setThread] = useState<ConversationThread | null>(null)
  const [targetUserId, setTargetUserId] = useState(conversation.targetUserId)

  useEffect(() => {
    const refreshConversation = () => {
      setThread(getMockConversationThread(conversation.id, identity))
    }

    refreshConversation()
    return subscribeToMockChat(refreshConversation)
  }, [conversation.id, identity])

  const activeConversation = thread?.conversation ?? conversation
  const messages = useMemo(() => thread?.messages ?? [], [thread])

  useEffect(() => {
    setTargetUserId(activeConversation.targetUserId)
  }, [activeConversation.targetUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(content: MessageContent) {
    setThread(appendMockMessage(conversation.id, content, identity))
  }

  function handleCloseConversation() {
    setThread(closeMockConversation(conversation.id, identity))
  }

  function handleSkipRating() {
    setThread(dismissMockConversationRatingPrompt(conversation.id, identity))
  }

  function handleSubmitRating(value: RatingValue) {
    if (!targetUserId) {
      return
    }

    setThread(submitMockConversationRating(conversation.id, value, identity))
  }

  const trimmedUsername = activeConversation.username.trim()
  const initial = trimmedUsername ? trimmedUsername[0].toUpperCase() : '?'
  const displayUsername = trimmedUsername || 'Conversație'

  return (
    <>
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-brand-black">
            {displayUsername}
          </p>
          <p className="text-xs text-brand-gray-text">Online</p>
        </div>

        {activeConversation.status === 'open' && (
          <button
            type="button"
            onClick={handleCloseConversation}
            aria-label="Marchează conversația ca finalizată"
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-brand-gray px-3 py-1.5 text-xs font-medium text-brand-gray-text transition-colors hover:border-green-500 hover:text-green-600"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Finalizat
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-brand-cream px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-1.5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        conversationClosed={activeConversation.status === 'closed'}
      />
      <ConversationRatingModal
        isOpen={activeConversation.ratingPromptPending}
        viewerRole={activeConversation.viewerRole}
        targetUserId={targetUserId}
        targetName={activeConversation.targetUserName}
        onSkip={handleSkipRating}
        onSubmit={(value) => handleSubmitRating(value)}
      />
    </>
  )
}
