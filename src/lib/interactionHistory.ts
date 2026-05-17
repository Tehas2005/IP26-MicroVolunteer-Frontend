import type { InteractionResponseType } from '@/sdk/types'

export interface InteractionHistoryEntry {
  id: string
  date?: string | null
  summary?: string | null
  rating?: number | null
}

const FALLBACK_SUMMARY = 'Rezumat indisponibil'
const FALLBACK_DATE = 'Data indisponibila'

export function getInteractionSummary(summary?: string | null) {
  return summary?.trim() || FALLBACK_SUMMARY
}

export function formatInteractionDate(date?: string | null) {
  if (!date) {
    return FALLBACK_DATE
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return FALLBACK_DATE
  }

  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
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

function readNumericRating(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (value && typeof value === 'object') {
    const nestedStars = (value as { stars?: unknown }).stars

    if (typeof nestedStars === 'number' && Number.isFinite(nestedStars)) {
      return nestedStars
    }
  }

  return null
}

export function mapInteractionToHistoryEntry(entry: InteractionResponseType): InteractionHistoryEntry {
  const title = normalizeString(entry.taskTitle) || normalizeString(entry.task?.title)
  const summary =
    normalizeString(entry.summary) ||
    normalizeString(entry.message) ||
    normalizeString(entry.description) ||
    (title ? `Interactiune pentru taskul "${title}".` : '')

  const ratingCandidate = readNumericRating(entry.rating) ?? readNumericRating(entry.stars)

  return {
    id: normalizeString(entry.id) || normalizeString(entry.interactionId) || crypto.randomUUID(),
    date:
      normalizeString(entry.createdAt) ||
      normalizeString(entry.updatedAt) ||
      normalizeString(entry.date) ||
      null,
    summary,
    rating: typeof ratingCandidate === 'number' ? ratingCandidate : null,
  }
}
