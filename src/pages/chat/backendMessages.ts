import type { Message } from './types'
import type { TaskMessageResponseType } from '@/sdk/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeString(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return ''
}

function normalizeDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return new Date()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function readSenderId(message: TaskMessageResponseType) {
  return (
    normalizeString(message.senderId) ||
    normalizeString(message.userId) ||
    normalizeString(message.authorUserId) ||
    normalizeString(message.createdByUserId) ||
    ''
  )
}

function mapMessageContent(message: TaskMessageResponseType): Message['content'] | null {
  const normalizedType = normalizeString(message.type).toUpperCase()

  if (normalizedType === 'AUDIOCONTENT') {
    const audioUrl = normalizeString(message.audioUrl)

    return audioUrl
      ? {
          type: 'audio',
          url: audioUrl,
        }
      : null
  }

  const textContent = normalizeString(message.content)

  return textContent
    ? {
        type: 'text',
        text: textContent,
      }
    : null
}

export function extractTaskMessages(payload: unknown): TaskMessageResponseType[] {
  const seen = new Set<unknown>()

  function extract(value: unknown): TaskMessageResponseType[] {
    if (Array.isArray(value)) {
      return value.filter(isRecord) as TaskMessageResponseType[]
    }

    if (!isRecord(value) || seen.has(value)) {
      return []
    }

    seen.add(value)

    for (const key of ['data', 'messages', 'items', 'results']) {
      const nestedValue = value[key]

      if (nestedValue === undefined) {
        continue
      }

      const extractedMessages = extract(nestedValue)

      if (extractedMessages.length > 0) {
        return extractedMessages
      }
    }

    return []
  }

  return extract(payload)
}

export function mapBackendMessagesToChatMessages(options: {
  payload: unknown
  currentUserId?: string | null
  isGuestViewer?: boolean
}): Message[] {
  const { payload, currentUserId, isGuestViewer = false } = options
  const normalizedCurrentUserId = normalizeString(currentUserId)
  const mappedMessages: Message[] = []

  extractTaskMessages(payload).forEach((message, index) => {
    const content = mapMessageContent(message)

    if (!content) {
      return
    }

    const rawSenderId = readSenderId(message)
    const senderId = rawSenderId || (isGuestViewer ? `guest-self-${index}` : `unknown-sender-${index}`)
    const from =
      isGuestViewer && !rawSenderId
        ? 'me'
        : normalizedCurrentUserId && rawSenderId === normalizedCurrentUserId
          ? 'me'
          : 'them'

    mappedMessages.push({
      id: normalizeString(message.id) || `${senderId}-${index}`,
      content,
      from,
      senderId,
      timestamp: normalizeDate(message.createdAt ?? message.sentAt ?? message.updatedAt),
    })
  })

  return mappedMessages.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime())
}
