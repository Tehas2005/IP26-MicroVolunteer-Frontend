import type { Conversation, ConversationStatus, Message, MessageContent } from '@/pages/chat/types'
import { getGuestSessionId } from './guestSession'

const STORAGE_KEY = 'mvcr-mock-chat-store'
const CHANGE_EVENT = 'mvcr-mock-chat-change'
const DEFAULT_REQUESTER_NAME = 'Solicitant'
const DEFAULT_VOLUNTEER_NAME = 'Voluntar'
const AUDIO_PREVIEW_TEXT = 'Mesaj vocal'

type StoredMessage = {
  id: string
  senderKey: string
  content: MessageContent
  sentAt: string
}

type StoredConversationRating = {
  authorKey: string
  targetUserId: string
  stars: number
  submittedAt: string
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
  ratings: StoredConversationRating[]
  skippedRatingBy: string[]
}

type StoredChatState = {
  conversations: StoredConversation[]
}

export type ChatViewerIdentity = {
  key: string
  displayName: string
  isGuest: boolean
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

type ChatThread = {
  conversation: Conversation
  messages: Message[]
  ratingPrompt: {
    targetUserId: string
    targetName: string
    viewerRole: 'requester' | 'volunteer'
    shouldPrompt: boolean
  } | null
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isStoredConversationRating(value: unknown): value is StoredConversationRating {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.authorKey === 'string' &&
    typeof candidate.targetUserId === 'string' &&
    typeof candidate.stars === 'number' &&
    candidate.stars >= 1 &&
    candidate.stars <= 5 &&
    typeof candidate.submittedAt === 'string'
  )
}

function normalizeStoredConversation(conversation: StoredConversation) {
  return {
    ...conversation,
    ratings: Array.isArray(conversation.ratings)
      ? conversation.ratings.filter(isStoredConversationRating)
      : [],
    skippedRatingBy: Array.isArray(conversation.skippedRatingBy)
      ? conversation.skippedRatingBy.filter((entry): entry is string => typeof entry === 'string')
      : [],
  }
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
      conversations: parsed.conversations.filter(
        (conversation: unknown): conversation is StoredConversation => {
          if (typeof conversation !== 'object' || conversation === null) {
            return false
          }

          const candidate = conversation as Record<string, unknown>

          return (
            typeof candidate.id === 'string' &&
            typeof candidate.requestId === 'string' &&
            typeof candidate.requestTitle === 'string' &&
            typeof candidate.requesterKey === 'string' &&
            typeof candidate.requesterName === 'string' &&
            typeof candidate.requesterIsGuest === 'boolean' &&
            typeof candidate.volunteerKey === 'string' &&
            typeof candidate.volunteerName === 'string' &&
            (candidate.status === 'open' || candidate.status === 'closed') &&
            typeof candidate.createdAt === 'string' &&
            typeof candidate.updatedAt === 'string' &&
            Array.isArray(candidate.messages)
          )
        },
      ).map((conversation: StoredConversation) => normalizeStoredConversation(conversation)),
    }
  } catch {
    return { conversations: [] }
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

  return lastMessage.content.type === 'audio' ? AUDIO_PREVIEW_TEXT : lastMessage.content.text
}

function mapStoredConversation(
  conversation: StoredConversation,
  viewerKey: string,
): Conversation {
  const isRequesterViewing = conversation.requesterKey === viewerKey
  const counterpartName = isRequesterViewing
    ? conversation.volunteerName
    : conversation.requesterName

  return {
    id: conversation.id,
    username: counterpartName,
    lastMessage: getConversationPreview(conversation.messages, conversation.requestTitle),
    timestamp: new Date(conversation.updatedAt),
    unread: 0,
    status: conversation.status,
    requestId: conversation.requestId,
    requestTitle: conversation.requestTitle,
  }
}

function buildRatingPrompt(
  conversation: StoredConversation,
  viewerKey: string,
): ChatThread['ratingPrompt'] {
  const isRequesterViewing = conversation.requesterKey === viewerKey
  const isVolunteerViewing = conversation.volunteerKey === viewerKey

  if (!isRequesterViewing && !isVolunteerViewing) {
    return null
  }

  const targetUserId = isRequesterViewing ? conversation.volunteerKey : conversation.requesterKey
  const targetName = isRequesterViewing ? conversation.volunteerName : conversation.requesterName
  const viewerRole = isRequesterViewing ? 'requester' : 'volunteer'
  const alreadyRated = conversation.ratings.some((rating) => rating.authorKey === viewerKey)
  const alreadySkipped = conversation.skippedRatingBy.includes(viewerKey)

  return {
    targetUserId,
    targetName,
    viewerRole,
    shouldPrompt: conversation.status === 'closed' && !alreadyRated && !alreadySkipped,
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

export function resolveChatViewerIdentity(user?: { id: string; name: string } | null): ChatViewerIdentity {
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
): ChatThread | null {
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
      from: message.senderKey === identity.key ? 'me' : 'them',
      senderId: message.senderKey,
      timestamp: new Date(message.sentAt),
    })),
    ratingPrompt: buildRatingPrompt(conversation, identity.key),
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
    return mapStoredConversation(existingConversation, identity.key)
  }

  const now = new Date().toISOString()
  const nextConversation: StoredConversation = {
    id: crypto.randomUUID(),
    requestId: seed.id,
    requestTitle: seed.title?.trim() || 'Cerere fără titlu',
    requesterKey,
    requesterName: normalizeRequesterLabel(seed),
    requesterIsGuest: seed.requesterKind === 'guest',
    volunteerKey: identity.key,
    volunteerName: identity.displayName || DEFAULT_VOLUNTEER_NAME,
    status: seed.status ?? 'open',
    createdAt: now,
    updatedAt: now,
    messages: [],
    ratings: [],
    skippedRatingBy: [],
  }

  writeState({
    conversations: [nextConversation, ...state.conversations],
  })

  return mapStoredConversation(nextConversation, identity.key)
}

export function appendMockMessage(
  conversationId: string,
  content: MessageContent,
  identity: ChatViewerIdentity,
): ChatThread | null {
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

export function submitMockConversationRating(
  conversationId: string,
  stars: number,
  identity: ChatViewerIdentity,
) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return null
  }

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

  const ratingPrompt = buildRatingPrompt(conversation, identity.key)

  if (!ratingPrompt || !ratingPrompt.shouldPrompt) {
    return null
  }

  const nextConversation: StoredConversation = {
    ...conversation,
    ratings: [
      ...conversation.ratings,
      {
        authorKey: identity.key,
        targetUserId: ratingPrompt.targetUserId,
        stars,
        submittedAt: new Date().toISOString(),
      },
    ],
  }

  const nextConversations = [...state.conversations]
  nextConversations[conversationIndex] = nextConversation
  writeState({ conversations: nextConversations })

  return {
    conversationId,
    stars,
    targetUserId: ratingPrompt.targetUserId,
  }
}

export function skipMockConversationRating(
  conversationId: string,
  identity: ChatViewerIdentity,
) {
  const state = readState()
  const conversationIndex = state.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  )

  if (conversationIndex === -1) {
    return false
  }

  const conversation = state.conversations[conversationIndex]

  if (conversation.requesterKey !== identity.key && conversation.volunteerKey !== identity.key) {
    return false
  }

  const ratingPrompt = buildRatingPrompt(conversation, identity.key)

  if (!ratingPrompt || !ratingPrompt.shouldPrompt) {
    return false
  }

  const nextConversation: StoredConversation = {
    ...conversation,
    skippedRatingBy: [...conversation.skippedRatingBy, identity.key],
  }

  const nextConversations = [...state.conversations]
  nextConversations[conversationIndex] = nextConversation
  writeState({ conversations: nextConversations })

  return true
}
