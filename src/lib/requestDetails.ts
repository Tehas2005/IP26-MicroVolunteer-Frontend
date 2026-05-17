import type { TaskCategoryType, TaskResponseType, TaskUrgencyType } from '@/sdk/types'

export const UNSPECIFIED_REQUEST_DETAIL = 'Nespecificat'

const HTTP_AUDIO_CAPTURE_PATTERN = '(https?:\\/\\/\\S+)'
const DATA_AUDIO_CAPTURE_PATTERN = '(data:audio\\/[^\\n]+)'
const AUDIO_DESCRIPTION_PATTERN = new RegExp(
  `AUDIOCONTENT[:\\s-]*(?:${HTTP_AUDIO_CAPTURE_PATTERN}|${DATA_AUDIO_CAPTURE_PATTERN})`,
  'i',
)
const VOICE_MESSAGE_DESCRIPTION_PATTERN = new RegExp(
  `Mesaj vocal[:\\s-]*(?:${HTTP_AUDIO_CAPTURE_PATTERN}|${DATA_AUDIO_CAPTURE_PATTERN})`,
  'i',
)
const AUDIO_MESSAGE_DESCRIPTION_PATTERN = new RegExp(
  `Mesaj audio[:\\s-]*(?:${HTTP_AUDIO_CAPTURE_PATTERN}|${DATA_AUDIO_CAPTURE_PATTERN})`,
  'i',
)
const LOCATION_DESCRIPTION_PATTERN = /Locatie declarata:\s*(.+)/i
const LOCATION_DESCRIPTION_PATTERN_WITH_DIACRITICS = /Locație declarată:\s*(.+)/i
const LANGUAGE_DESCRIPTION_PATTERN = /Limba necesara:\s*(.+)/i
const LANGUAGE_DESCRIPTION_PATTERN_WITH_DIACRITICS = /Limbă necesară:\s*(.+)/i
const SAFETY_DESCRIPTION_PATTERN = /Siguranta:\s*(.+)/i
const SAFETY_DESCRIPTION_PATTERN_WITH_DIACRITICS = /Siguranță:\s*(.+)/i
const SKILLS_DESCRIPTION_PATTERN = /Skills needed:\s*(.+)/i
const ROMANIAN_SKILLS_DESCRIPTION_PATTERN = /Abilitati necesare:\s*(.+)/i
const ROMANIAN_SKILLS_DESCRIPTION_PATTERN_WITH_DIACRITICS = /Abilități necesare:\s*(.+)/i

export type RequestDetailsPayload = {
  notes: string
  languageNeeded: string
  safetyNotes: string
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

function normalizeAudioSource(value: string | null) {
  if (!value) {
    return null
  }

  if (!value.startsWith('data:audio/')) {
    return value
  }

  return value.replace(/\s+/g, '')
}

function readMatchedAudioValue(description: string, pattern: RegExp) {
  const match = description.match(pattern)

  if (!match) {
    return null
  }

  const matchedValue = match[1] ?? match[2] ?? null
  return normalizeAudioSource(readTrimmedString(matchedValue))
}

function readMetadataValue(description: string | null, ...patterns: RegExp[]): string | null {
  if (!description) {
    return null
  }

  for (const pattern of patterns) {
    const matchedValue = description.match(pattern)?.[1]
    const normalizedValue = readTrimmedString(matchedValue)

    if (normalizedValue) {
      return normalizedValue
    }
  }

  return null
}

function removeMetadataLines(description: string) {
  return description
    .split(/\n+/)
    .map((line) =>
      line
        .replace(AUDIO_DESCRIPTION_PATTERN, '')
        .replace(VOICE_MESSAGE_DESCRIPTION_PATTERN, '')
        .replace(AUDIO_MESSAGE_DESCRIPTION_PATTERN, '')
        .trim(),
    )
    .filter(Boolean)
    .filter(
      (line) =>
        !AUDIO_DESCRIPTION_PATTERN.test(line) &&
        !VOICE_MESSAGE_DESCRIPTION_PATTERN.test(line) &&
        !AUDIO_MESSAGE_DESCRIPTION_PATTERN.test(line) &&
        !LANGUAGE_DESCRIPTION_PATTERN.test(line) &&
        !LANGUAGE_DESCRIPTION_PATTERN_WITH_DIACRITICS.test(line) &&
        !SAFETY_DESCRIPTION_PATTERN.test(line) &&
        !SAFETY_DESCRIPTION_PATTERN_WITH_DIACRITICS.test(line) &&
        !LOCATION_DESCRIPTION_PATTERN.test(line) &&
        !LOCATION_DESCRIPTION_PATTERN_WITH_DIACRITICS.test(line) &&
        !SKILLS_DESCRIPTION_PATTERN.test(line) &&
        !ROMANIAN_SKILLS_DESCRIPTION_PATTERN.test(line) &&
        !ROMANIAN_SKILLS_DESCRIPTION_PATTERN_WITH_DIACRITICS.test(line),
    )
    .join('\n\n')
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
      readMetadataValue(
        description,
        LANGUAGE_DESCRIPTION_PATTERN,
        LANGUAGE_DESCRIPTION_PATTERN_WITH_DIACRITICS,
      ) ??
      UNSPECIFIED_REQUEST_DETAIL,
    safetyNotes:
      readTrimmedString(rawDetails.safetyNotes) ??
      readMetadataValue(
        description,
        SAFETY_DESCRIPTION_PATTERN,
        SAFETY_DESCRIPTION_PATTERN_WITH_DIACRITICS,
      ) ??
      UNSPECIFIED_REQUEST_DETAIL,
  }
}

export function readTaskAudioUrl(task: TaskResponseType | null | undefined): string | null {
  const directAudioUrl = normalizeAudioSource(readTrimmedString(task?.audioUrl))

  if (directAudioUrl) {
    return directAudioUrl
  }

  const description = readTrimmedString(task?.description)

  if (!description) {
    return null
  }

  const matchedUrl =
    readMatchedAudioValue(description, AUDIO_DESCRIPTION_PATTERN) ??
    readMatchedAudioValue(description, VOICE_MESSAGE_DESCRIPTION_PATTERN) ??
    readMatchedAudioValue(description, AUDIO_MESSAGE_DESCRIPTION_PATTERN)

  return matchedUrl ? matchedUrl.replace(/[),.;]+$/, '') : null
}

export function readTaskTextDescription(task: TaskResponseType | null | undefined): string | null {
  const description = readTrimmedString(task?.description)

  if (!description) {
    return null
  }

  const cleanedDescription = removeMetadataLines(description)

  return cleanedDescription || null
}

export function readTaskCategoryLabel(category?: TaskCategoryType | null) {
  if (category === 'FACETOFACE' || category === 'FACE_TO_FACE') {
    return 'Față în față'
  }

  if (category === 'MESSAGES_ONLY') {
    return 'Doar mesaje'
  }

  return UNSPECIFIED_REQUEST_DETAIL
}

export function readTaskDeclaredLocation(task: TaskResponseType | null | undefined) {
  const description = readTrimmedString(task?.description)

  return (
    readTrimmedString(task?.city) ??
    readTrimmedString(task?.addressText) ??
    readMetadataValue(
      description,
      LOCATION_DESCRIPTION_PATTERN,
      LOCATION_DESCRIPTION_PATTERN_WITH_DIACRITICS,
    ) ??
    UNSPECIFIED_REQUEST_DETAIL
  )
}

export function hasCompleteRequestDetailsInput(requestDetails: RequestDetailsPayload) {
  return Boolean(
    requestDetails.notes && requestDetails.languageNeeded && requestDetails.safetyNotes,
  )
}

export function hasPartialRequestDetailsInput(requestDetails: RequestDetailsPayload) {
  return hasRequestDetailsInput(requestDetails) && !hasCompleteRequestDetailsInput(requestDetails)
}

export function readTaskNeededSkills(task: TaskResponseType | null | undefined): string[] {
  const description = readTrimmedString(task?.description)
  const rawSkills = readMetadataValue(
    description,
    SKILLS_DESCRIPTION_PATTERN,
    ROMANIAN_SKILLS_DESCRIPTION_PATTERN,
    ROMANIAN_SKILLS_DESCRIPTION_PATTERN_WITH_DIACRITICS,
  )

  if (!rawSkills) {
    return []
  }

  return rawSkills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export function mapOfferSubmitErrorMessage(message?: string | null) {
  const normalizedMessage = readTrimmedString(message)

  if (!normalizedMessage) {
    return 'Nu am putut trimite oferta de ajutor. Încearcă din nou.'
  }

  switch (normalizedMessage) {
    case 'A pending offer already exists for this volunteer and task':
    case 'Volunteer already has a pending offer for this task':
      return 'Ai deja o ofertă în așteptare pentru această cerere.'
    case 'HelpRequest is not OPEN':
      return 'Această cerere de ajutor a fost deja preluată de alt voluntar.'
    case 'Only volunteers can submit offers for tasks':
    case 'Only volunteers can create offers':
      return 'Doar voluntarii pot trimite oferte pentru cereri.'
    case 'A user cannot create an offer on his own task':
    case 'Task owner cannot create offers':
      return 'Nu poți trimite o ofertă la propria ta cerere.'
    default:
      return normalizedMessage
  }
}

export function readTaskUrgencyMeta(urgency?: TaskUrgencyType | null): TaskUrgencyMeta {
  switch (urgency) {
    case 'LOW':
      return {
        accentClassName: 'bg-brand-green',
        badgeClassName: 'bg-brand-green/12 text-brand-green',
        label: 'Urgență scăzută',
      }
    case 'MEDIUM':
      return {
        accentClassName: 'bg-brand-orange',
        badgeClassName: 'bg-brand-orange/12 text-brand-orange',
        label: 'Urgență medie',
      }
    case 'HIGH':
      return {
        accentClassName: 'bg-brand-red/85',
        badgeClassName: 'bg-brand-red/12 text-brand-red/90',
        label: 'Urgență ridicată',
      }
    case 'CRITICAL':
      return {
        accentClassName: 'bg-brand-red',
        badgeClassName: 'bg-brand-red/12 text-brand-red',
        label: 'Urgență critică',
      }
    default:
      return {
        accentClassName: 'bg-brand-gray',
        badgeClassName: 'bg-brand-gray/15 text-brand-gray-text',
        label: UNSPECIFIED_REQUEST_DETAIL,
      }
  }
}
