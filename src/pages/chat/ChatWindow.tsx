import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react'

import { backend } from '@/lib/backend'
import { backendWebSocketOrigin } from '@/lib/apiConfig'
import { readGuestSessionId } from '@/lib/guestSession'
import { extractTaskPayload } from '@/lib/liveRequests'
import { readUploadedAssetUrl } from '@/lib/uploads'
import type { TaskResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

import { mapBackendMessagesToChatMessages } from './backendMessages'
import {
  findExistingViewerRating,
  readTaskAssignmentId,
  resolveRatingSubmissionPayload,
} from './backendRating'
import { ChatInput } from './ChatInput'
import { ConversationRatingModal } from './ConversationRatingModal'
import { MessageBubble } from './MessageBubble'
import type { Conversation, Message, OutgoingMessageContent, RatingValue } from './types'

interface Props {
  conversation: Conversation
}

function createAudioFile(blob: Blob) {
  return new File([blob], `chat-audio-${Date.now()}.webm`, {
    type: blob.type || 'audio/webm',
  })
}

function buildTaskWebSocketUrl(taskId: string, guestSessionId?: string) {
  const queryString = guestSessionId
    ? `?${new URLSearchParams({ guestSession: guestSessionId }).toString()}`
    : ''

  return `${backendWebSocketOrigin}/api/tasks/${taskId}/ws${queryString}`
}

function buildGuestHeaders(guestSessionId: string) {
  return guestSessionId ? { 'X-Guest-Session': guestSessionId } : undefined
}

function normalizeTaskStatus(status: string | null | undefined) {
  return typeof status === 'string' ? status.trim().toUpperCase() : ''
}

function isRealtimeEligibleTaskStatus(status: string | null | undefined) {
  const normalizedStatus = normalizeTaskStatus(status)
  return (
    normalizedStatus === 'ASSIGNED' ||
    normalizedStatus === 'MATCHED' ||
    normalizedStatus === 'IN_PROGRESS' ||
    normalizedStatus === 'COMPLETED'
  )
}

function isTaskCompleted(status: string | null | undefined) {
  return normalizeTaskStatus(status) === 'COMPLETED'
}

export function ChatWindow({ conversation }: Props) {
  const navigate = useNavigate()
  const socketRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)
  const isGuest = useAuthStore((state) => state.isGuest)
  const [messages, setMessages] = useState<Message[]>([])
  const [taskSnapshot, setTaskSnapshot] = useState<TaskResponseType | null>(null)
  const [actionError, setActionError] = useState('')
  const [isCompletingTask, setIsCompletingTask] = useState(false)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isSocketReady, setIsSocketReady] = useState(false)
  const [ratingPromptDismissed, setRatingPromptDismissed] = useState(false)
  const [submittedRating, setSubmittedRating] = useState<RatingValue | null>(null)
  const [hasResolvedExistingRating, setHasResolvedExistingRating] = useState(false)

  const requestId = conversation.requestId ?? conversation.id
  const guestSessionId = isGuest ? readGuestSessionId() : ''
  const isGuestRequesterViewing = isGuest && Boolean(guestSessionId)
  const viewerIdentityReady = Boolean(user?.id || isGuestRequesterViewing)
  const isRealtimeReady = taskSnapshot ? isRealtimeEligibleTaskStatus(taskSnapshot.status) : false
  const isConversationClosed =
    conversation.status === 'closed' || isTaskCompleted(taskSnapshot?.status)
  const shouldShowRatingPrompt =
    isConversationClosed &&
    !conversation.viewerHasRated &&
    submittedRating === null &&
    hasResolvedExistingRating &&
    !ratingPromptDismissed

  useEffect(() => {
    setActionError('')
    setIsSocketReady(false)
    setRatingPromptDismissed(false)
    setSubmittedRating(null)
    setHasResolvedExistingRating(false)
    setMessages([])
  }, [conversation.id])

  const loadMessages = useCallback(async () => {
    if (!requestId) {
      setMessages([])
      return
    }

    const response = await backend.tasks.getMessages(requestId, {
      headers: isGuestRequesterViewing ? buildGuestHeaders(guestSessionId) : undefined,
    })

    if (!response.success) {
      setActionError(response.message || 'Nu am putut incarca mesajele conversatiei.')
      return
    }

    setMessages(
      mapBackendMessagesToChatMessages({
        payload: response.data,
        currentUserId: user?.id,
        isGuestViewer: isGuestRequesterViewing,
      }),
    )
  }, [guestSessionId, isGuestRequesterViewing, requestId, user?.id])

  const loadTaskSnapshot = useCallback(async () => {
    if (!requestId) {
      setTaskSnapshot(null)
      return
    }

    const response = await backend.tasks.getById(requestId, {
      headers: isGuestRequesterViewing ? buildGuestHeaders(guestSessionId) : undefined,
    })

    if (!response.success || !response.data) {
      return
    }

    const task = extractTaskPayload(response.data)

    if (!task) {
      return
    }

    setTaskSnapshot(task)
  }, [guestSessionId, isGuestRequesterViewing, requestId])

  useEffect(() => {
    void loadTaskSnapshot()
  }, [loadTaskSnapshot])

  useEffect(() => {
    if (!requestId || isRealtimeReady) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadTaskSnapshot()
    }, 1500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isRealtimeReady, loadTaskSnapshot, requestId])

  useEffect(() => {
    let isMounted = true

    async function syncMessages() {
      if (!isMounted) {
        return
      }

      await loadMessages()
    }

    void syncMessages()

    return () => {
      isMounted = false
    }
  }, [loadMessages])

  useEffect(() => {
    if (!requestId || !viewerIdentityReady || !isRealtimeReady) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadMessages()
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isRealtimeReady, loadMessages, requestId, viewerIdentityReady])

  useEffect(() => {
    if (!requestId || !viewerIdentityReady || !isRealtimeReady) {
      socketRef.current?.close()
      socketRef.current = null
      setIsSocketReady(false)
      return
    }

    let isActive = true
    let reconnectTimerId: number | null = null

    const connectSocket = () => {
      if (!isActive) {
        return
      }

      const socket = new WebSocket(
        buildTaskWebSocketUrl(requestId, isGuestRequesterViewing ? guestSessionId : undefined),
      )
      socketRef.current = socket

      socket.addEventListener('open', () => {
        if (!isActive || socketRef.current !== socket) {
          return
        }

        setIsSocketReady(true)
        setActionError((currentError) =>
          currentError === 'Conexiunea live pentru chat nu a putut fi stabilita.' ||
          currentError === 'Conexiunea de chat nu este pregatita. Reincearca in cateva secunde.'
            ? ''
            : currentError,
        )
        void loadMessages()
      })

      socket.addEventListener('message', () => {
        if (!isActive || socketRef.current !== socket) {
          return
        }

        void loadMessages()
      })

      socket.addEventListener('error', () => {
        if (!isActive || socketRef.current !== socket) {
          return
        }

        setIsSocketReady(false)
        if (socket.readyState !== WebSocket.OPEN) {
          setActionError('Conexiunea live pentru chat nu a putut fi stabilita.')
        }
      })

      socket.addEventListener('close', () => {
        if (!isActive || socketRef.current !== socket) {
          return
        }

        setIsSocketReady(false)
        reconnectTimerId = window.setTimeout(() => {
          void loadMessages()
          connectSocket()
        }, 2000)
      })
    }

    connectSocket()

    return () => {
      isActive = false
      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId)
      }

      socketRef.current?.close()

      socketRef.current = null
    }
  }, [
    guestSessionId,
    isGuestRequesterViewing,
    isRealtimeReady,
    loadMessages,
    requestId,
    viewerIdentityReady,
  ])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (
      !isConversationClosed ||
      !conversation.targetUserId ||
      !user?.id ||
      conversation.viewerHasRated ||
      submittedRating !== null ||
      ratingPromptDismissed
    ) {
      setHasResolvedExistingRating(true)
      return
    }

    const taskAssignmentId = readTaskAssignmentId(taskSnapshot)
    const viewerUserId = user.id

    if (taskAssignmentId === null) {
      if (taskSnapshot) {
        setHasResolvedExistingRating(true)
      }
      return
    }

    const ensuredTaskAssignmentId: number = taskAssignmentId

    let isActive = true

    async function loadExistingRating() {
      const response = await backend.ratings.getForUser(conversation.targetUserId)

      if (!isActive) {
        return
      }

      if (!response.success || !Array.isArray(response.data)) {
        setHasResolvedExistingRating(true)
        return
      }

      const existingRating = findExistingViewerRating({
        ratings: response.data,
        taskAssignmentId: ensuredTaskAssignmentId,
        viewerUserId,
      })

      if (existingRating !== null) {
        setSubmittedRating(existingRating as RatingValue)
      }

      setHasResolvedExistingRating(true)
    }

    void loadExistingRating()

    return () => {
      isActive = false
    }
  }, [
    conversation.targetUserId,
    isConversationClosed,
    ratingPromptDismissed,
    submittedRating,
    taskSnapshot,
    user?.id,
  ])

  function appendOptimisticMessage(content: Message['content']) {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content,
        from: 'me',
        senderId: user?.id ?? guestSessionId ?? 'guest-self',
        timestamp: new Date(),
      },
    ])
  }

  function scheduleMessagesRefresh() {
    window.setTimeout(() => {
      void loadMessages()
    }, 250)

    window.setTimeout(() => {
      void loadMessages()
    }, 1000)
  }

  async function handleSend(content: OutgoingMessageContent) {
    setActionError('')

    if (!requestId) {
      setActionError(
        'Acest chat nu este legat de un task sincronizat cu backendul, deci mesajele nu pot fi trimise.',
      )
      return
    }

    if (!user?.id && !isGuestRequesterViewing) {
      setActionError(
        'Trimiterea mesajelor in timp real este disponibila doar daca sesiunea autentificata sau guest este valida.',
      )
      return
    }

    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN || !isSocketReady) {
      setActionError('Conexiunea de chat nu este pregatita. Reincearca in cateva secunde.')
      return
    }

    setIsSendingMessage(true)

    try {
      if (content.type === 'text') {
        appendOptimisticMessage({
          type: 'text',
          text: content.text,
        })

        socket.send(
          JSON.stringify({
            type: 'SEND_MESSAGE',
            data: {
              type: 'TEXTCONTENT',
              content: content.text,
            },
          }),
        )
      } else {
        const uploadResponse = await backend.uploads.uploadAudio(createAudioFile(content.blob))

        if (!uploadResponse.success) {
          setActionError(
            uploadResponse.message || 'Nu am putut incarca mesajul vocal. Incearca din nou.',
          )
          return
        }

        const audioUrl = readUploadedAssetUrl(uploadResponse.data)

        if (!audioUrl) {
          setActionError('Backendul nu a returnat URL-ul mesajului vocal incarcat.')
          return
        }

        appendOptimisticMessage({
          type: 'audio',
          url: content.previewUrl,
        })

        socket.send(
          JSON.stringify({
            type: 'SEND_MESSAGE',
            data: {
              type: 'AUDIOCONTENT',
              audioUrl,
            },
          }),
        )
      }

      scheduleMessagesRefresh()
    } finally {
      setIsSendingMessage(false)
    }
  }

  async function handleCloseConversation() {
    setActionError('')

    if (!requestId) {
      setActionError(
        'Acest chat nu este conectat la un task real din backend, deci nu poate fi finalizat aici.',
      )
      return
    }

    setIsCompletingTask(true)

    try {
      const requestOptions = {
        headers: isGuestRequesterViewing ? buildGuestHeaders(guestSessionId) : undefined,
      }

      let nextTaskSnapshot = taskSnapshot

      if (!nextTaskSnapshot) {
        const taskResponse = await backend.tasks.getById(requestId, requestOptions)

        if (!taskResponse.success || !taskResponse.data) {
          setActionError(
            taskResponse.message || 'Nu am putut incarca taskul inainte de finalizare.',
          )
          return
        }

        const task = extractTaskPayload(taskResponse.data)

        if (!task) {
          setActionError('Nu am putut interpreta taskul returnat de backend.')
          return
        }

        nextTaskSnapshot = task
        setTaskSnapshot(task)
      }

      const currentStatus = normalizeTaskStatus(nextTaskSnapshot.status)
      const statusesToApply =
        currentStatus === 'MATCHED'
          ? (['IN_PROGRESS', 'COMPLETED'] as const)
          : currentStatus === 'IN_PROGRESS'
            ? (['COMPLETED'] as const)
            : currentStatus === 'COMPLETED'
              ? []
              : null

      if (statusesToApply === null) {
        setActionError('Taskul trebuie sa fie in MATCHED sau IN_PROGRESS pentru a fi finalizat.')
        return
      }

      for (const nextStatus of statusesToApply) {
        const response = await backend.tasks.updateStatus(
          requestId,
          { status: nextStatus },
          requestOptions,
        )

        if (!response.success) {
          setActionError(
            response.message || 'Nu am putut marca taskul ca finalizat. Incearca din nou.',
          )
          return
        }
      }

      await loadTaskSnapshot()
      await loadMessages()
    } finally {
      setIsCompletingTask(false)
    }
  }

  function handleSkipRating() {
    setActionError('')
    setRatingPromptDismissed(true)
  }

  async function handleSubmitRating(value: RatingValue, comment: string) {
    setActionError('')

    if (!conversation.targetUserId) {
      return
    }

    if (!requestId) {
      setActionError(
        'Acest chat nu este legat de un task sincronizat cu backendul, deci ratingul real nu poate fi trimis.',
      )
      return
    }

    setIsSubmittingRating(true)

    try {
      let nextTaskSnapshot = taskSnapshot

      if (!nextTaskSnapshot || !isTaskCompleted(nextTaskSnapshot.status)) {
        const taskResponse = await backend.tasks.getById(requestId, {
          headers: isGuestRequesterViewing ? buildGuestHeaders(guestSessionId) : undefined,
        })

        if (!taskResponse.success || !taskResponse.data) {
          setActionError(
            taskResponse.message || 'Nu am putut incarca taskul pentru a trimite ratingul.',
          )
          return
        }

        const task = extractTaskPayload(taskResponse.data)

        if (!task) {
          setActionError('Nu am putut interpreta taskul returnat de backend.')
          return
        }

        nextTaskSnapshot = task
        setTaskSnapshot(task)
      }

      const { payload, errorMessage } = resolveRatingSubmissionPayload({
        task: nextTaskSnapshot,
        viewerUserId: user?.id,
        targetUserId: conversation.targetUserId,
        stars: value,
        comment,
      })

      if (!payload) {
        setActionError(errorMessage || 'Nu am putut pregati ratingul pentru backend.')
        return
      }

      const response = await backend.ratings.create(payload)

      if (!response.success) {
        if (response.message?.toLowerCase().includes('already exists')) {
          setSubmittedRating(value)
          return
        }

        setActionError(response.message || 'Nu am putut trimite ratingul. Incearca din nou.')
        return
      }

      setSubmittedRating(value)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const trimmedUsername = conversation.username.trim()
  const initial = trimmedUsername ? trimmedUsername[0].toUpperCase() : '?'
  const displayUsername = trimmedUsername || 'Conversatie'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-brand-black">
            {displayUsername}
          </p>
          <p className="text-xs text-brand-gray-text">Online</p>
        </div>

        {!isConversationClosed && (
          <button
            type="button"
            onClick={() => void handleCloseConversation()}
            disabled={isCompletingTask}
            aria-label="Marcheaza conversatia ca finalizata"
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-brand-gray px-3 py-1.5 text-xs font-medium text-brand-gray-text transition-colors hover:border-green-500 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isCompletingTask ? 'Se finalizeaza...' : 'Finalizat'}
          </button>
        )}
      </div>

      {actionError ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700 sm:px-8">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{actionError}</p>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-brand-cream px-4 py-3 sm:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto mt-8 max-w-xl rounded-[28px] border border-brand-purple/20 bg-white/90 px-5 py-4 text-center shadow-sm">
            <p className="text-sm font-semibold text-brand-black">
              {isRealtimeReady ? 'Conversatia este pregatita' : 'Pregatim conversatia'}
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-gray-text">
              {isRealtimeReady
                ? 'Oferta a fost acceptata. Daca solicitantul nu a trimis inca un mesaj, poti incepe tu conversatia chiar acum.'
                : 'Asteptam confirmarea finala a taskului din backend inainte sa deschidem chatul live.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={(content) => void handleSend(content)}
        conversationClosed={isConversationClosed}
        sendingMessage={isSendingMessage}
      />
      <ConversationRatingModal
        isOpen={shouldShowRatingPrompt}
        viewerRole={conversation.viewerRole}
        targetUserId={conversation.targetUserId}
        targetName={conversation.targetUserName}
        onSkip={handleSkipRating}
        onSubmit={(value, comment) => {
          if (isSubmittingRating) {
            return
          }

          void handleSubmitRating(value, comment)
        }}
      />
    </div>
  )
}
