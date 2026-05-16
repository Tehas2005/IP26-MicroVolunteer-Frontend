import type {
  Conversation,
  ConversationStatus,
  ConversationThread,
  MessageContent,
  Rating,
  RatingValue,
} from '@/pages/chat/types'
import { getGuestSessionId } from './guestSession'

const STORAGE_KEY = 'mvcr-mock-chat-store'
const CHANGE_EVENT = 'mvcr-mock-chat-change'
const DEFAULT_REQUESTER_NAME = 'Solicitant'
const DEFAULT_VOLUNTEER_NAME = 'Voluntar'
const AUDIO_PREVIEW_TEXT = 'Mesaj vocal'
const REQUEST_CANCELLED_SYSTEM_MESSAGE = 'Autorul a anulat această cerere.'

type StoredMessage = {
  id: string
  senderKey: string
  content: MessageContent
  sentAt: string
}

type StoredRating = {
  id: string
  authorKey: string
  targetUserId: string
  value: RatingValue
  createdAt: string
}

type StoredConversation = {
  id: string
  requestId: string
  requestTitle: string
  requesterKey: string
  requesterName: string
  requesterIsGuest: boolean
  volunteerKey: string
  volunteerName: string
  status: ConversationStatus
  createdAt: string
  updatedAt: string
  messages: StoredMessage[]
  ratings: StoredRating[]
  ratingPromptDismissedBy: string[]
}

type StoredChatState = {
  conversations: StoredConversation[]
}

export type ChatViewerIdentity = {
  key: string
  displayName: string
  isGuest: boolean
}

export type MatchedVolunteerSeed = {
  volunteerKey: string
  volunteerName: string
}

export type ChatRequestSeed = {
  id: string
  title?: string | null
  requesterKey?: string | null
  requesterLabel?: string | null
  requesterKind?: 'guest' | 'user'
  anonymousMode?: boolean | null
  username?: string | null
  name?: string | null
  status?: ConversationStatus
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readState(): StoredChatState {
  if (!canUseStorage()) {
    return { conversations: [] }
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return { conversations: [] }
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('conversations' in parsed) ||
      !Array.isArray(parsed.conversations)
    ) {
      return { conversations: [] }
    }

    return {
      conversations: parsed.conversations
        .map((conversation: unknown) => normalizeStoredConversation(conversation))
        .filter(
          (conversation: StoredConversation | null): conversation is StoredConversation =>
            conversation !== null,
        ),
    }
  } catch {
    return { conversations: [] }
  }
}

function normalizeStoredConversation(rawConversation: unknown): StoredConversation | null {
  if (typeof rawConversation !== 'object' || rawConversation === null) {
    return null
  }

  const candidate = rawConversation as Record<string, unknown>

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.requestId !== 'string' ||
    typeof candidate.requestTitle !== 'string' ||
    typeof candidate.requesterKey !== 'string' ||
    typeof candidate.requesterName !== 'string' ||
    typeof candidate.requesterIsGuest !== 'boolean' ||
    typeof candidate.volunteerKey !== 'string' ||
    typeof candidate.volunteerName !== 'string' ||
    (candidate.status !== 'open' && candidate.status !== 'closed') ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string' ||
    !Array.isArray(candidate.messages)
  ) {
    return null
  }

  const ratings = Array.isArray(candidate.ratings)
    ? candidate.ratings.filter(
        (rating): rating is StoredRating =>
          typeof rating === 'object' &&
          rating !== null &&
          typeof (rating as StoredRating).id === 'string' &&
          typeof (rating as StoredRating).authorKey === 'string' &&
          typeof (rating as StoredRating).targetUserId === 'string' &&
          [1, 2, 3, 4, 5].includes((rating as StoredRating).value) &&
          typeof (rating as StoredRating).createdAt === 'string',
      )
    : []

  const ratingPromptDismissedBy = Array.isArray(candidate.ratingPromptDismissedBy)
    ? candidate.ratingPromptDismissedBy.filter(
        (viewerKey): viewerKey is string => typeof viewerKey === 'string',
      )
    : []

  return {
    id: candidate.id,
    requestId: candidate.requestId,
    requestTitle: candidate.requestTitle,
    requesterKey: candidate.requesterKey,
    requesterName: candidate.requesterName,
    requesterIsGuest: candidate.requesterIsGuest,
    volunteerKey: candidate.volunteerKey,
    volunteerName: candidate.volunteerName,
    status: candidate.status,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    messages: candidate.messages as StoredMessage[],
    ratings,
    ratingPromptDismissedBy,
  }
}

function emitChange() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function writeState(nextState: StoredChatState) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  emitChange()
}

function getConversationPreview(messages: StoredMessage[], requestTitle: string) {
  const lastMessage = messages[messages.length - 1]

  if (!lastMessage) {
    return requestTitle ? `Cerere: ${requestTitle}` : 'Conversație nouă'
  }

  if (
    lastMessage.senderKey.startsWith('system:') &&
    lastMessage.content.type === 'text' &&
    lastMessage.content.text.trim()
  ) {
    return lastMessage.content.text
  }

  return lastMessage.content.type === 'audio' ? AUDIO_PREVIEW_TEXT : lastMessage.content.text
}

function getViewerConversationMeta(conversation: StoredConversation, viewerKey: string) {
  const isRequesterViewing = conversation.requesterKey === viewerKey
  const targetUserId = isRequesterViewing ? conversation.volunteerKey : conversation.requesterKey
  const targetUserName = isRequesterViewing ? conversation.volunteerName : conversation.requesterName
  const viewerRating = conversation.ratings.find((rating) => rating.authorKey === viewerKey)
  const viewerHasRated = Boolean(viewerRating)
  const ratingPromptPending =
    conversation.status === 'closed' &&
    !viewerHasRated &&
    !conversation.ratingPromptDismissedBy.includes(viewerKey)

  return {
    isRequesterViewing,
    targetUserId,
    targetUserName: targetUserName.trim() || DEFAULT_REQUESTER_NAME,
    viewerHasRated,
    ratingPromptPending,
    viewerRating:
      viewerRating === undefined
        ? null
        : ({
            id: viewerRating.id,
            targetUserId: viewerRating.targetUserId,
            value: viewerRating.value,
            createdAt: new Date(viewerRating.createdAt),
          } satisfies Rating),
  }
}

function mapStoredConversation(
  conversation: StoredConversation,
  viewerKey: string,
): Conversation {
  const {
    isRequesterViewing,
    targetUserId,
    targetUserName,
    viewerHasRated,
    ratingPromptPending,
    viewerRating,
  } = getViewerConversationMeta(conversation, viewerKey)

  return {
    id: conversation.id,
    username: targetUserName,
    lastMessage: getConversationPreview(conversation.messages, conversation.requestTitle),
    timestamp: new Date(conversation.updatedAt),
    unread: 0,
    status: conversation.status,
    requestId: conversation.requestId,
    requestTitle: conversation.requestTitle,
    targetUserId,
    targetUserName,
    viewerRole: isRequesterViewing ? 'requester' : 'volunteer',
    viewerHasRated,
    ratingPromptPending,
    viewerRating,
  }
}

function normalizeRequesterLabel(seed: ChatRequestSeed) {
  if (seed.requesterLabel?.trim()) {
    return seed.requesterLabel.trim()
  }

  if (seed.anonymousMode && seed.username?.trim()) {
    return seed.username.trim()
  }

  if (seed.name?.trim()) {
    return seed.name.trim()
  }

  return DEFAULT_REQUESTER_NAME
}

export function resolveChatViewerIdentity(
  user?: { id: string; name: string } | null,
): ChatViewerIdentity {
  if (user?.id) {
    return {
      key: `user:${user.id}`,
      displayName: user.name?.trim() || DEFAULT_VOLUNTEER_NAME,
      isGuest: false,
    }
  }

  return {
    key: `guest:${getGuestSessionId()}`,
    displayName: 'Vizitator',
    isGuest: true,
  }
}

export function subscribeToMockChat(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = (event: Event) => {
    if (event instanceof StorageEvent && event.key && event.key !== STORAGE_KEY) {
      return
    }

    listener()
  }

  window.addEventListener(CHANGE_EVENT, handleStorage)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleStorage)
    window.removeEventListener('storage', handleStorage)
  }
}

export function listMockConversations(identity: ChatViewerIdentity): Conversation[] {
  const state = readState()

  return state.conversations
    .filter(
      (conversation) =>
        conversation.requesterKey === identity.key || conversation.volunteerKey === identity.key,
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((conversation) => mapStoredConversation(conversation, identity.key))
}

export function getMockConversationThread(
  conversationId: string,
  identity: ChatViewerIdentity,
): ConversationThread | null {
  const conversation = readState().conversations.find((item) => item.id === conversationId)

  if (
    !conversation ||
    (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key)
  ) {
    return null
  }

  return {
    conversation: mapStoredConversation(conversation, identity.key),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      content: message.content,
      from: message.senderKey.startsWith('system:')
        ? 'system'
        : message.senderKey === identity.key
          ? 'me'
          : 'them',
      senderId: message.senderKey,
      timestamp: new Date(message.sentAt),
    })),
  }
}

export function ensureMockConversation(
  seed: ChatRequestSeed,
  identity: ChatViewerIdentity,
): Conversation {
  const state = readState()
  const requesterKey = seed.requesterKey?.trim() || `guest-request:${seed.id}`
  const existingConversation = state.conversations.find(
    (conversation) =>
      conversation.requestId === seed.id &&
      conversation.requesterKey === requesterKey &&
      conversation.volunteerKey === identity.key,
  )

  if (existingConversation) {
    const nextStatus = seed.status ?? existingConversation.status

    if (nextStatus !== existingConversation.status) {
      const nextConversation: StoredConversation = {
        ...existingConversation,
        status: nextStatus,
        ratingPromptDismissedBy:
          nextStatus === 'closed' ? [] : existingConversation.ratingPromptDismissedBy,
      }
      const nextConversations = state.conversations.map((conversation) =>
        conversation.id === existingConversation.id ? nextConversation : conversation,
      )

      writeState({ conversations: nextConversations })
      return mapStoredConversation(nextConversation, identity.key)
    }

    return mapStoredConversation(existingConversation, identity.key)
  }

  const now = new Date().toISOString()
  const nextConversation: StoredConversation = {
    id: crypto.randomUUID(),
    requestId: seed.id,
    requestTitle: seed.title?.trim() || 'Cerere fără titlu',
    requesterKey,
    requesterName: normalizeRequesterLabel(seed),
    requesterIsGuest: identity.isGuest,
    volunteerKey: identity.key,
    volunteerName: identity.displayName || DEFAULT_VOLUNTEER_NAME,
    status: seed.status ?? 'open',
    createdAt: now,
    updatedAt: now,
    messages: [],
    ratings: [],
    ratingPromptDismissedBy: [],
  }

  writeState({
    conversations: [nextConversation, ...state.conversations],
  })

  return mapStoredConversation(nextConversation, identity.key)
}

export function ensureMockConversationForAcceptedOffer(
  seed: ChatRequestSeed,
  requesterIdentity: ChatViewerIdentity,
  volunteer: MatchedVolunteerSeed,
): Conversation {
  const state = readState()
  const requesterKey = seed.requesterKey?.trim() || `guest-request:${seed.id}`
  const existingConversation = state.conversations.find(
    (conversation) =>
      conversation.requestId === seed.id &&
      conversation.requesterKey === requesterKey &&
      conversation.volunteerKey === volunteer.volunteerKey,
  )

  if (existingConversation) {
    return mapStoredConversation(existingConversation, requesterIdentity.key)
  }

  const now = new Date().toISOString()
  const nextConversation: StoredConversation = {
    id: crypto.randomUUID(),
    requestId: seed.id,
    requestTitle: seed.title?.trim() || 'Cerere fără titlu',
    requesterKey,
    requesterName: normalizeRequesterLabel({
      ...seed,
      requesterLabel: seed.requesterLabel?.trim() || requesterIdentity.displayName,
      name: seed.name?.trim() || requesterIdentity.displayName,
    }),
    requesterIsGuest:
      seed.requesterKind === 'guest' || (!seed.requesterKind && requesterIdentity.isGuest),
    volunteerKey: volunteer.volunteerKey,
    volunteerName: volunteer.volunteerName.trim() || DEFAULT_VOLUNTEER_NAME,
    status: seed.status ?? 'open',
    createdAt: now,
    updatedAt: now,
    messages: [],
    ratings: [],
    ratingPromptDismissedBy: [],
  }

  writeState({
    conversations: [nextConversation, ...state.conversations],
  })

  return mapStoredConversation(nextConversation, requesterIdentity.key)
}

export function appendMockMessage(
  conversationId: string,
  content: MessageContent,
  identity: ChatViewerIdentity,
): ConversationThread | null {
  const state = readState()
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  )

  if (conversationIndex === -1) {
    return null
  }

  const conversation = state.conversations[conversationIndex]

  if (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key) {
    return null
  }

  const now = new Date().toISOString()
  const nextMessage: StoredMessage = {
    id: crypto.randomUUID(),
    senderKey: identity.key,
    content,
    sentAt: now,
  }

  const nextConversation: StoredConversation = {
    ...conversation,
    updatedAt: now,
    messages: [...conversation.messages, nextMessage],
  }

  const nextConversations = [...state.conversations]
  nextConversations.splice(conversationIndex, 1)
  nextConversations.unshift(nextConversation)

  writeState({ conversations: nextConversations })

  return getMockConversationThread(conversationId, identity)
}

export function closeMockConversation(
  conversationId: string,
  identity: ChatViewerIdentity,
): ConversationThread | null {
  const state = readState()
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  )

  if (conversationIndex === -1) {
    return null
  }

  const conversation = state.conversations[conversationIndex]

  if (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key) {
    return null
  }

  if (conversation.status === 'closed') {
    return getMockConversationThread(conversationId, identity)
  }

  const nextConversation: StoredConversation = {
    ...conversation,
    status: 'closed',
    ratingPromptDismissedBy: [],
    updatedAt: new Date().toISOString(),
  }

  const nextConversations = [...state.conversations]
  nextConversations.splice(conversationIndex, 1, nextConversation)
  writeState({ conversations: nextConversations })

  return getMockConversationThread(conversationId, identity)
}

export function submitMockConversationRating(
  conversationId: string,
  value: RatingValue,
  identity: ChatViewerIdentity,
): ConversationThread | null {
  const state = readState()
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  )

  if (conversationIndex === -1) {
    return null
  }

  const conversation = state.conversations[conversationIndex]

  if (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key) {
    return null
  }

  const { targetUserId } = getViewerConversationMeta(conversation, identity.key)
  const now = new Date().toISOString()
  const existingRatingIndex = conversation.ratings.findIndex(
    (rating) => rating.authorKey === identity.key,
  )
  const nextRating: StoredRating = {
    id:
      existingRatingIndex === -1
        ? crypto.randomUUID()
        : conversation.ratings[existingRatingIndex].id,
    authorKey: identity.key,
    targetUserId,
    value,
    createdAt: now,
  }

  const nextRatings =
    existingRatingIndex === -1
      ? [...conversation.ratings, nextRating]
      : conversation.ratings.map((rating, index) =>
          index === existingRatingIndex ? nextRating : rating,
        )

  const nextConversation: StoredConversation = {
    ...conversation,
    ratings: nextRatings,
    ratingPromptDismissedBy: conversation.ratingPromptDismissedBy.filter(
      (viewerKey) => viewerKey !== identity.key,
    ),
    updatedAt: now,
  }

  const nextConversations = [...state.conversations]
  nextConversations.splice(conversationIndex, 1)
  nextConversations.unshift(nextConversation)
  writeState({ conversations: nextConversations })

  return getMockConversationThread(conversationId, identity)
}

export function dismissMockConversationRatingPrompt(
  conversationId: string,
  identity: ChatViewerIdentity,
): ConversationThread | null {
  const state = readState()
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  )

  if (conversationIndex === -1) {
    return null
  }

  const conversation = state.conversations[conversationIndex]

  if (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key) {
    return null
  }

  if (conversation.ratingPromptDismissedBy.includes(identity.key)) {
    return getMockConversationThread(conversationId, identity)
  }

  const nextConversation: StoredConversation = {
    ...conversation,
    ratingPromptDismissedBy: [...conversation.ratingPromptDismissedBy, identity.key],
  }

  const nextConversations = [...state.conversations]
  nextConversations.splice(conversationIndex, 1, nextConversation)
  writeState({ conversations: nextConversations })

  return getMockConversationThread(conversationId, identity)
}

export function cancelMockRequestConversations(
  requestId: string,
  requesterIdentity: ChatViewerIdentity,
) {
  const state = readState()
  const nextConversations = state.conversations.map((conversation) => {
    if (conversation.requestId !== requestId || conversation.requesterKey !== requesterIdentity.key) {
      return conversation
    }

    const alreadyMarkedCancelled = conversation.messages.some(
      (message) =>
        message.senderKey === 'system:request-cancelled' &&
        message.content.type === 'text' &&
        message.content.text === REQUEST_CANCELLED_SYSTEM_MESSAGE,
    )

    const nextMessages = alreadyMarkedCancelled
      ? conversation.messages
      : [
          ...conversation.messages,
          {
            id: crypto.randomUUID(),
            senderKey: 'system:request-cancelled',
            content: {
              type: 'text' as const,
              text: REQUEST_CANCELLED_SYSTEM_MESSAGE,
            },
            sentAt: new Date().toISOString(),
          } satisfies StoredMessage,
        ]

    return {
      ...conversation,
      status: 'closed' as const,
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
      ratingPromptDismissedBy: [conversation.requesterKey, conversation.volunteerKey],
    }
  })

  writeState({ conversations: nextConversations })
}
