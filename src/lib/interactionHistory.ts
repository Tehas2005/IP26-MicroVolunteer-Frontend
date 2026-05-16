import type { AuthUser } from '@/store/authStore'

export interface InteractionHistoryEntry {
  id: string
  date?: string | null
  summary?: string | null
  rating?: number | null
}

const FALLBACK_SUMMARY = 'Rezumat indisponibil'
const FALLBACK_DATE = 'Data indisponibilă'

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

export function getMockInteractionHistory(user?: AuthUser | null): InteractionHistoryEntry[] {
  if (!user) {
    return []
  }

  return [
    {
      id: `${user.id}-history-1`,
      date: '2026-05-04T14:30:00.000Z',
      summary: 'Ai oferit sprijin pentru completarea unui formular local.',
      rating: 5,
    },
    {
      id: `${user.id}-history-2`,
      date: '2026-05-02T09:15:00.000Z',
      summary: 'Ai primit ajutor prin mesaje pentru clarificarea unei programări medicale.',
      rating: 4,
    },
    {
      id: `${user.id}-history-3`,
      date: '2026-04-29T18:45:00.000Z',
      summary: '',
      rating: 3,
    },
  ]
}
