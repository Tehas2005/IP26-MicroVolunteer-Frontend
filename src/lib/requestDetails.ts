import type { TaskCategoryType, TaskResponseType, TaskUrgencyType } from '@/sdk/types'

export const UNSPECIFIED_REQUEST_DETAIL = 'Nespecificat'

const AUDIO_DESCRIPTION_PATTERN = /AUDIOCONTENT[:\s-]*(https?:\/\/\S+)/i

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

  return {
    notes: readTrimmedString(rawDetails.notes) ?? UNSPECIFIED_REQUEST_DETAIL,
    languageNeeded: readTrimmedString(rawDetails.languageNeeded) ?? UNSPECIFIED_REQUEST_DETAIL,
    safetyNotes: readTrimmedString(rawDetails.safetyNotes) ?? UNSPECIFIED_REQUEST_DETAIL,
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

  const cleanedDescription = description.replace(AUDIO_DESCRIPTION_PATTERN, '').trim()

  return cleanedDescription || null
}

export function readTaskCategoryLabel(category?: TaskCategoryType | null) {
  if (category === 'FACETOFACE' || category === 'FACE_TO_FACE') {
    return 'FACETOFACE'
  }

  if (category === 'MESSAGES_ONLY') {
    return 'MESSAGES_ONLY'
  }

  return UNSPECIFIED_REQUEST_DETAIL
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
