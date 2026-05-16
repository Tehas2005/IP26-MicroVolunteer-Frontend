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

export function mapInteractionToHistoryEntry(entry: InteractionResponseType): InteractionHistoryEntry {
  const title = normalizeString(entry.taskTitle) || normalizeString(entry.task?.title)
  const summary =
    normalizeString(entry.summary) ||
    normalizeString(entry.message) ||
    normalizeString(entry.description) ||
    (title ? `Interactiune pentru taskul "${title}".` : '')

  const ratingCandidate = typeof entry.rating === 'number' ? entry.rating : entry.stars

  return {
    id: normalizeString(entry.id) || crypto.randomUUID(),
    date: normalizeString(entry.createdAt) || normalizeString(entry.updatedAt) || null,
    summary,
    rating: typeof ratingCandidate === 'number' ? ratingCandidate : null,
  }
}

