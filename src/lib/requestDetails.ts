import type { TaskCategoryType, TaskResponseType, TaskUrgencyType } from '@/sdk/types'

export const UNSPECIFIED_REQUEST_DETAIL = 'Nespecificat'

const AUDIO_DESCRIPTION_PATTERN = /AUDIOCONTENT[:\s-]*(https?:\/\/\S+)/i
const LANGUAGE_PATTERN = /(?:^|\n)Limba necesara:\s*(.+?)(?=\n|$)/i
const SAFETY_PATTERN = /(?:^|\n)Siguranta:\s*(.+?)(?=\n|$)/i
const LOCATION_PATTERN = /(?:^|\n)Locatie declarata:\s*(.+?)(?=\n|$)/i
const SKILLS_PATTERN = /(?:^|\n)(?:Skills needed|Abilitati necesare):\s*(.+?)(?=\n|$)/i

export type RequestDetailsPayload = {
  notes?: string
  languageNeeded?: string
  safetyNotes?: string
}

type RequestDetailsShape = {
  notes?: unknown
  languageNeeded?: unknown
  safetyNotes?: unknown
}

type TaskUrgencyMeta = {
  accentClassName: string
  badgeClassName: string
  label: string
}

type RequestSummary = {
  location: string
  skills: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function matchDescriptionField(description: string | null, pattern: RegExp) {
  if (!description) {
    return null
  }

  const matchedValue = description.match(pattern)?.[1]
  return readTrimmedString(matchedValue)
}

function removeDescriptionMetadata(description: string) {
  return description
    .replace(AUDIO_DESCRIPTION_PATTERN, '')
    .replace(LANGUAGE_PATTERN, '')
    .replace(SAFETY_PATTERN, '')
    .replace(LOCATION_PATTERN, '')
    .replace(SKILLS_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractTaskResponseData(payload: unknown): TaskResponseType | null {
  if (isRecord(payload) && ('id' in payload || 'title' in payload || 'details' in payload)) {
    return payload as TaskResponseType
  }

  if (!isRecord(payload) || !('data' in payload)) {
    return null
  }

  const nestedData = payload.data

  return isRecord(nestedData) ? (nestedData as TaskResponseType) : null
}

export function buildRequestDetailsPayload(
  notes?: string | null,
  languageNeeded?: string | null,
  safetyNotes?: string | null,
): RequestDetailsPayload {
  return {
    notes: readTrimmedString(notes) ?? '',
    languageNeeded: readTrimmedString(languageNeeded) ?? '',
    safetyNotes: readTrimmedString(safetyNotes) ?? '',
  }
}

export function hasRequestDetailsInput(payload: RequestDetailsPayload) {
  return Boolean(payload.notes || payload.languageNeeded || payload.safetyNotes)
}

export function readRequestDetails(task: TaskResponseType | null | undefined) {
  const rawDetails = isRecord(task?.details) ? (task.details as RequestDetailsShape) : {}
  const description = readTrimmedString(task?.description)

  return {
    notes:
      readTrimmedString(rawDetails.notes) ??
      readTaskTextDescription(task) ??
      UNSPECIFIED_REQUEST_DETAIL,
    languageNeeded:
      readTrimmedString(rawDetails.languageNeeded) ??
      matchDescriptionField(description, LANGUAGE_PATTERN) ??
      UNSPECIFIED_REQUEST_DETAIL,
    safetyNotes:
      readTrimmedString(rawDetails.safetyNotes) ??
      matchDescriptionField(description, SAFETY_PATTERN) ??
      UNSPECIFIED_REQUEST_DETAIL,
  }
}

export function readTaskAudioUrl(task: TaskResponseType | null | undefined): string | null {
  const directAudioUrl = readTrimmedString(task?.audioUrl)

  if (directAudioUrl) {
    return directAudioUrl
  }

  const description = readTrimmedString(task?.description)

  if (!description) {
    return null
  }

  const matchedUrl = description.match(AUDIO_DESCRIPTION_PATTERN)?.[1]

  return matchedUrl ? matchedUrl.replace(/[),.;]+$/, '') : null
}

export function readTaskTextDescription(task: TaskResponseType | null | undefined): string | null {
  const description = readTrimmedString(task?.description)

  if (!description) {
    return null
  }

  const cleanedDescription = removeDescriptionMetadata(description)

  return cleanedDescription || null
}

export function readTaskCategoryLabel(category?: TaskCategoryType | null) {
  if (category === 'FACETOFACE' || category === 'FACE_TO_FACE') {
    return 'Față în față'
  }

  if (category === 'MESSAGES_ONLY') {
    return 'Mesaje'
  }

  return UNSPECIFIED_REQUEST_DETAIL
}

export function readRequestSummary(task: TaskResponseType | null | undefined): RequestSummary {
  const description = readTrimmedString(task?.description)
  const parsedSkills =
    matchDescriptionField(description, SKILLS_PATTERN)
      ?.split(',')
      .map((skill) => skill.trim())
      .filter(Boolean) ?? []

  return {
    location:
      readTrimmedString(task?.city) ??
      readTrimmedString(task?.addressText) ??
      matchDescriptionField(description, LOCATION_PATTERN) ??
      UNSPECIFIED_REQUEST_DETAIL,
    skills: parsedSkills,
  }
}

export function mapOfferSubmitErrorMessage(message?: string | null) {
  const normalizedMessage = message?.trim().toLowerCase()

  if (!normalizedMessage) {
    return 'Nu am putut trimite oferta de ajutor. Încearcă din nou.'
  }

  if (
    normalizedMessage.includes('volunteer already has a pending offer for this task') ||
    normalizedMessage.includes('a pending offer already exists for this volunteer and task')
  ) {
    return 'Ai deja o ofertă în așteptare pentru această cerere.'
  }

  if (normalizedMessage.includes('helprequest is not open')) {
    return 'Această cerere de ajutor a fost deja preluată de alt voluntar.'
  }

  if (
    normalizedMessage.includes('only volunteers can create offers') ||
    normalizedMessage.includes('only volunteers can submit offers for tasks')
  ) {
    return 'Doar voluntarii pot trimite oferte pentru cereri.'
  }

  if (
    normalizedMessage.includes('task owner cannot create offers') ||
    normalizedMessage.includes('cannot create an offer on his own task')
  ) {
    return 'Nu poți trimite o ofertă pentru propria ta cerere.'
  }

  return message ?? 'Nu am putut trimite oferta de ajutor. Încearcă din nou.'
}

export function readTaskUrgencyMeta(urgency?: TaskUrgencyType | null): TaskUrgencyMeta {
  switch (urgency) {
    case 'LOW':
      return {
        accentClassName: 'bg-brand-green',
        badgeClassName: 'bg-brand-green/12 text-brand-green',
        label: 'Urgenta scazuta',
      }
    case 'MEDIUM':
      return {
        accentClassName: 'bg-brand-orange',
        badgeClassName: 'bg-brand-orange/12 text-brand-orange',
        label: 'Urgenta medie',
      }
    case 'HIGH':
      return {
        accentClassName: 'bg-brand-red/85',
        badgeClassName: 'bg-brand-red/12 text-brand-red/90',
        label: 'Urgenta ridicata',
      }
    case 'CRITICAL':
      return {
        accentClassName: 'bg-brand-red',
        badgeClassName: 'bg-brand-red/12 text-brand-red',
        label: 'Urgenta critica',
      }
    default:
      return {
        accentClassName: 'bg-brand-gray',
        badgeClassName: 'bg-brand-gray/15 text-brand-gray-text',
        label: UNSPECIFIED_REQUEST_DETAIL,
      }
  }
}
