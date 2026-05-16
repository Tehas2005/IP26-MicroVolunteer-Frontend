import type { LiveRequestCardData, LiveRequestUrgencyLevel } from '@/components/shared/LiveRequestCard'

export interface VolunteerNotificationItem {
  id: string
  title: string
  message: string
  request: LiveRequestCardData
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
    request,
  }
}
