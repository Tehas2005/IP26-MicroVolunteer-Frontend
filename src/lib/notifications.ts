import type { NotificationResponseType } from '@/sdk/types'

type NotificationSocketEnvelope = {
  data?: unknown
  type?: unknown
}

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

function parsePayload(payload: unknown): unknown {
  if (typeof payload !== 'string') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export function extractNotificationPayload(payload: unknown): NotificationResponseType | null {
  const parsedPayload = parsePayload(payload)

  if (isRecord(parsedPayload) && 'id' in parsedPayload) {
    return parsedPayload as NotificationResponseType
  }

  if (!isRecord(parsedPayload)) {
    return null
  }

  const envelope = parsedPayload as NotificationSocketEnvelope

  if (
    normalizeString(envelope.type).toUpperCase() === 'NOTIFICATION' &&
    isRecord(envelope.data) &&
    'id' in envelope.data
  ) {
    return envelope.data as NotificationResponseType
  }

  if (isRecord(envelope.data)) {
    return extractNotificationPayload(envelope.data)
  }

  return null
}

export function readNotificationId(notification: NotificationResponseType) {
  return normalizeString(notification.id)
}

export function readNotificationTaskId(notification: NotificationResponseType) {
  return normalizeString(notification.relatedRequestId)
}

export function readNotificationText(notification: NotificationResponseType) {
  return normalizeString(notification.text)
}

export function readNotificationType(notification: NotificationResponseType) {
  return normalizeString(notification.type).toUpperCase()
}
