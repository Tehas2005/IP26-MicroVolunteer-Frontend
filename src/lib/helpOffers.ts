import type { OfferResponseType, ProfileType, RatingSummaryType } from '@/sdk/types'

export type HelpOfferStatus = 'pending' | 'accepted' | 'rejected'

export interface HelpOfferData {
  id: string
  requestId: string
  volunteerKey: string
  volunteerName: string
  averageRating: number
  createdAt: string
  message: string
  status: HelpOfferStatus
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readNestedArray(payload: unknown, keys: string[]): OfferResponseType[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as OfferResponseType[]
  }

  if (!isRecord(payload)) {
    return []
  }

  for (const key of keys) {
    const nextValue = payload[key]

    if (Array.isArray(nextValue)) {
      return nextValue.filter(isRecord) as OfferResponseType[]
    }
  }

  if ('data' in payload) {
    return readNestedArray(payload.data, ['data', 'offers', 'items', 'results'])
  }

  return []
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

function normalizeOfferStatus(value: unknown): HelpOfferStatus {
  const normalized = normalizeString(value).toUpperCase()

  if (normalized === 'ACCEPTED') {
    return 'accepted'
  }

  if (normalized === 'REJECTED') {
    return 'rejected'
  }

  return 'pending'
}

function readProfileDisplayName(profile: ProfileType | null | undefined, fallback: string) {
  if (!profile || !isRecord(profile)) {
    return fallback
  }

  const directName =
    normalizeString(profile.displayName) ||
    normalizeString(profile['name']) ||
    [normalizeString(profile.firstName), normalizeString(profile.lastName)].filter(Boolean).join(' ')

  return directName || fallback
}

export function formatHelpOfferRelativeTime(
  createdAt: Date | string,
  now = new Date(),
): string {
  const offerDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const diffMs = now.getTime() - offerDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000))

  if (diffMinutes < 1) {
    return 'acum cateva secunde'
  }

  if (diffMinutes === 1) {
    return 'acum 1 minut'
  }

  if (diffMinutes < 60) {
    return `acum ${diffMinutes} minute`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours === 1) {
    return 'acum 1 ora'
  }

  if (diffHours < 24) {
    return `acum ${diffHours} ore`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays === 1) {
    return 'acum 1 zi'
  }

  return `acum ${diffDays} zile`
}

export function extractOfferList(payload: unknown): OfferResponseType[] {
  return readNestedArray(payload, ['data', 'offers', 'items', 'results'])
}

export function readOfferVolunteerId(offer: OfferResponseType) {
  return (
    normalizeString(offer.volunteerId) ||
    normalizeString(offer.volunteerUserId) ||
    normalizeString(offer.userId) ||
    ''
  )
}

export function readOfferTaskId(offer: OfferResponseType) {
  return (
    normalizeString(offer.helpRequestId) ||
    normalizeString(offer.taskId) ||
    normalizeString(offer.task?.id) ||
    ''
  )
}

export function mapOfferToHelpOffer(options: {
  offer: OfferResponseType
  requestId: string
  profile?: ProfileType | null
  ratingSummary?: RatingSummaryType | null
}): HelpOfferData {
  const { offer, requestId, profile, ratingSummary } = options
  const volunteerId = readOfferVolunteerId(offer)
  const fallbackVolunteerName = volunteerId ? `Voluntar ${volunteerId}` : 'Voluntar'
  const ratingValue = Number(ratingSummary?.averageRating)

  return {
    id: normalizeString(offer.id) || `${requestId}-${volunteerId || 'offer'}`,
    requestId,
    volunteerKey: volunteerId ? `user:${volunteerId}` : 'user:unknown-volunteer',
    volunteerName: readProfileDisplayName(profile ?? offer.volunteer ?? null, fallbackVolunteerName),
    averageRating: Number.isFinite(ratingValue) ? ratingValue : 0,
    createdAt: normalizeString(offer.createdAt) || new Date().toISOString(),
    message: normalizeString(offer.message) || 'Voluntarul nu a adaugat un mesaj.',
    status: normalizeOfferStatus(offer.status),
  }
}
