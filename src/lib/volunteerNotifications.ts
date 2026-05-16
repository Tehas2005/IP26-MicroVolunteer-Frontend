import type {
  LiveRequestCardData,
  LiveRequestUrgencyLevel,
} from '@/components/shared/LiveRequestCard'
import { backendRealtimeOrigin } from '@/lib/apiConfig'
import { extractNotificationsList, parseNotificationSocketFrame } from '@/lib/notifications'
import type { NotificationRecordType } from '@/sdk/types'

export interface VolunteerNotificationItem {
  id: string
  title: string
  message: string
  relatedRequestId: string | null
  relatedAssignmentId: string | null
  createdAt: string | null
  readAt: string | null
  request: LiveRequestCardData | null
}

const FALLBACK_MESSAGE = 'A aparut o cerere noua in feedul tau de voluntar.'
const DESCRIPTION_METADATA_PREFIXES = ['locatie declarata:', 'skills needed:', 'mesaj vocal:']

function trimToLength(value: string, maxLength: number) {
  const normalizedValue = value.trim()

  if (normalizedValue.length <= maxLength) {
    return normalizedValue
  }

  return `${normalizedValue.slice(0, maxLength - 1).trimEnd()}…`
}

function getNotificationTitle(urgencyLevel?: LiveRequestUrgencyLevel | null) {
  if (urgencyLevel === 'CRITICAL' || urgencyLevel === 'HIGH') {
    return 'Noua cerere urgenta!'
  }

  if (urgencyLevel === 'MEDIUM') {
    return 'Cerere compatibila noua'
  }

  return 'Cerere noua pentru voluntari'
}

function getPrimaryDescription(description?: string | null) {
  if (!description) {
    return null
  }

  const firstMeaningfulLine = description
    .split('\n')
    .map((line) => line.trim())
    .find((line) => {
      if (!line) {
        return false
      }

      const normalizedLine = line.toLowerCase()
      return !DESCRIPTION_METADATA_PREFIXES.some((prefix) => normalizedLine.startsWith(prefix))
    })

  return firstMeaningfulLine || null
}

function buildContextFragments(request: LiveRequestCardData) {
  const fragments: string[] = []

  if (request.city?.trim()) {
    fragments.push(`Zona: ${request.city.trim()}`)
  }

  if (request.skillsNeeded?.length) {
    fragments.push(`Skill-uri: ${request.skillsNeeded.join(', ')}`)
  }

  return fragments
}

export function getVolunteerNotificationId(requestId: string) {
  return `volunteer-alert:${requestId}`
}

export function buildVolunteerNotificationMessage(request: LiveRequestCardData) {
  const description = getPrimaryDescription(request.description)
  const contextFragments = buildContextFragments(request)
  const messageParts = [description, ...contextFragments].filter(Boolean)

  if (messageParts.length === 0) {
    return FALLBACK_MESSAGE
  }

  return trimToLength(messageParts.join(' '), 170)
}

export function createVolunteerNotification(
  request: LiveRequestCardData,
): VolunteerNotificationItem {
  return {
    id: getVolunteerNotificationId(request.id),
    title: getNotificationTitle(request.urgencyLevel),
    message: buildVolunteerNotificationMessage(request),
    relatedRequestId: request.id,
    relatedAssignmentId: null,
    createdAt: null,
    readAt: null,
    request,
  }
}

function normalizeId(value: string | number | null | undefined): string | null {
  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return null
}

function mapNotificationTypeToTitle(type?: string | null) {
  if (type === 'NEW_REQUEST') {
    return 'Cerere nouă pentru voluntari'
  }

  if (type === 'OFFER_ACCEPTED') {
    return 'Ofertă acceptată'
  }

  if (type === 'TASK_UPDATED') {
    return 'Cerere actualizată'
  }

  if (type === 'TASK_COMPLETED') {
    return 'Cerere finalizată'
  }

  if (type === 'WARNING' || type === 'ACCOUNT_DISABLED') {
    return 'Notificare importantă'
  }

  return 'Notificare nouă'
}

export function createVolunteerNotificationFromBackend(
  notification: NotificationRecordType,
  request: LiveRequestCardData | null = null,
): VolunteerNotificationItem | null {
  const notificationId = normalizeId(notification.id)

  if (!notificationId) {
    return null
  }

  return {
    id: notificationId,
    title: mapNotificationTypeToTitle(notification.type),
    message:
      typeof notification.text === 'string' && notification.text.trim()
        ? notification.text.trim()
        : FALLBACK_MESSAGE,
    relatedRequestId: normalizeId(notification.relatedRequestId),
    relatedAssignmentId: normalizeId(notification.relatedAssignmentId),
    createdAt: typeof notification.createdAt === 'string' ? notification.createdAt : null,
    readAt: typeof notification.readAt === 'string' ? notification.readAt : null,
    request,
  }
}

export function mapNotificationRecordsToItems(
  payload: unknown,
  requestLookup: Map<string, LiveRequestCardData> = new Map(),
): VolunteerNotificationItem[] {
  return extractNotificationsList(payload)
    .map((notification) => {
      const relatedRequestId = normalizeId(notification.relatedRequestId)
      const request = relatedRequestId ? requestLookup.get(relatedRequestId) ?? null : null
      return createVolunteerNotificationFromBackend(notification, request)
    })
    .filter((notification): notification is VolunteerNotificationItem => notification !== null)
}

export function mapNotificationSocketFrameToItem(
  payload: string,
  requestLookup: Map<string, LiveRequestCardData> = new Map(),
): VolunteerNotificationItem | null {
  const notification = parseNotificationSocketFrame(payload)

  if (!notification) {
    return null
  }

  const relatedRequestId = normalizeId(notification.relatedRequestId)
  const request = relatedRequestId ? requestLookup.get(relatedRequestId) ?? null : null

  return createVolunteerNotificationFromBackend(notification, request)
}

export function buildNotificationsWebSocketUrl(guestSessionId?: string | null) {
  const targetUrl = new URL('/api/notifications/ws', backendRealtimeOrigin)
  targetUrl.protocol = targetUrl.protocol === 'https:' ? 'wss:' : 'ws:'

  if (guestSessionId?.trim()) {
    targetUrl.searchParams.set('guestSessionId', guestSessionId.trim())
  }

  return targetUrl.toString()
}
