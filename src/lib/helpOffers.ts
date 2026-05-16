import type { OfferResponseType } from '@/sdk/types'

export type HelpOfferStatus = 'pending' | 'accepted' | 'rejected'

export interface HelpOfferData {
  id: string
  requestId: string
  volunteerId?: string | null
  volunteerKey: string
  volunteerName: string
  averageRating: number
  createdAt: string
  message: string
  status: HelpOfferStatus
  taskAssignmentId?: string | null
  conversationId?: string | null
}

type ResponseEnvelope<T> = {
  data?: T | null
}

type PaginatedOffersPayload = {
  data?: OfferResponseType[] | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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

function readEnvelopeData<T>(payload: unknown): T | null {
  if (!isRecord(payload) || !('data' in payload)) {
    return null
  }

  return (payload as ResponseEnvelope<T>).data ?? null
}

function mapOfferStatus(status?: string | null): HelpOfferStatus {
  if (status === 'ACCEPTED') {
    return 'accepted'
  }

  if (status === 'REJECTED') {
    return 'rejected'
  }

  return 'pending'
}

function getVolunteerName(offer: OfferResponseType): string {
  const name = offer.volunteer?.name

  if (typeof name === 'string' && name.trim()) {
    return name.trim()
  }

  const username = offer.volunteer?.username

  if (typeof username === 'string' && username.trim()) {
    return username.trim()
  }

  return 'Voluntar'
}

function getVolunteerKey(offer: OfferResponseType): string {
  const volunteerId = normalizeId(offer.volunteerId)

  if (volunteerId) {
    return `user:${volunteerId}`
  }

  const username = offer.volunteer?.username

  if (typeof username === 'string' && username.trim()) {
    return `username:${username.trim()}`
  }

  return `offer:${normalizeId(offer.id) ?? crypto.randomUUID()}`
}

function getAverageRating(offer: OfferResponseType): number {
  const candidate = offer.volunteer?.averageRating

  if (!Number.isFinite(candidate)) {
    return 0
  }

  return Math.min(5, Math.max(0, Number(candidate)))
}

function normalizeCreatedAt(createdAt?: string | null) {
  if (typeof createdAt === 'string' && createdAt.trim()) {
    return createdAt
  }

  return new Date().toISOString()
}

export function mapBackendOfferToHelpOffer(
  offer: OfferResponseType,
  requestId: string,
): HelpOfferData | null {
  const id = normalizeId(offer.id)

  if (!id) {
    return null
  }

  return {
    id,
    requestId,
    volunteerId: normalizeId(offer.volunteerId),
    volunteerKey: getVolunteerKey(offer),
    volunteerName: getVolunteerName(offer),
    averageRating: getAverageRating(offer),
    createdAt: normalizeCreatedAt(offer.createdAt),
    message: typeof offer.message === 'string' ? offer.message.trim() : '',
    status: mapOfferStatus(offer.status),
    taskAssignmentId: normalizeId(
      offer.taskAssignmentId as string | number | null | undefined,
    ),
    conversationId: normalizeId(
      offer.conversationId as string | number | null | undefined,
    ),
  }
}

export function extractTaskOffers(payload: unknown, requestId: string): HelpOfferData[] {
  const paginatedPayload = readEnvelopeData<unknown>(payload)

  if (!isRecord(paginatedPayload)) {
    return []
  }

  const offersData = (paginatedPayload as PaginatedOffersPayload).data

  if (!Array.isArray(offersData)) {
    return []
  }

  return offersData
    .filter(isRecord)
    .map((offer) => mapBackendOfferToHelpOffer(offer as OfferResponseType, requestId))
    .filter((offer): offer is HelpOfferData => offer !== null)
}

export function extractOfferRedirectMeta(payload: unknown) {
  const offer = readEnvelopeData<unknown>(payload)

  if (!isRecord(offer)) {
    return {
      helpRequestId: null,
      conversationId: null,
      taskAssignmentId: null,
    }
  }

  return {
    helpRequestId: normalizeId(offer.helpRequestId as string | number | null | undefined),
    conversationId: normalizeId(offer.conversationId as string | number | null | undefined),
    taskAssignmentId: normalizeId(
      offer.taskAssignmentId as string | number | null | undefined,
    ),
  }
}

export function formatHelpOfferRelativeTime(
  createdAt: Date | string,
  now = new Date(),
): string {
  const offerDate = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const diffMs = now.getTime() - offerDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000))

  if (diffMinutes < 1) {
    return 'acum câteva secunde'
  }

  if (diffMinutes === 1) {
    return 'acum 1 minut'
  }

  if (diffMinutes < 60) {
    return `acum ${diffMinutes} minute`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours === 1) {
    return 'acum 1 oră'
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

export function getReceivedOffersSummaryFromOffers(offers: HelpOfferData[]) {
  const acceptedOffer = offers.find((offer) => offer.status === 'accepted')
  const pendingCount = offers.filter((offer) => offer.status === 'pending').length
  const rejectedCount = offers.filter((offer) => offer.status === 'rejected').length

  if (acceptedOffer) {
    return `Ajutor acceptat de la ${acceptedOffer.volunteerName}`
  }

  if (offers.length > 0 && rejectedCount === offers.length) {
    return `Toate cele ${offers.length} oferte au fost refuzate.`
  }

  if (pendingCount === 1) {
    return '1 ofertă primită. Apasă pentru a decide.'
  }

  if (pendingCount > 1) {
    return `${pendingCount} oferte primite. Apasă pentru a decide.`
  }

  return 'Apasă pentru a vedea ofertele primite.'
}
