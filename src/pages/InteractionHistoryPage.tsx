import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'

import InteractionHistoryList from '@/components/shared/InteractionHistoryList'
import { backend } from '@/lib/backend'
import { mapInteractionToHistoryEntry, type InteractionHistoryEntry } from '@/lib/interactionHistory'
import type { InteractionResponseType, RatingResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

function extractInteractionItems(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const candidate = payload as { data?: unknown }
  return Array.isArray(candidate.data) ? candidate.data : []
}

function extractRatings(payload: unknown) {
  return Array.isArray(payload) ? payload : []
}

function mapRatingToHistoryEntry(rating: RatingResponseType): InteractionHistoryEntry {
  const ratingValue = typeof rating.stars === 'number' ? rating.stars : null
  const comment = typeof rating.comment === 'string' ? rating.comment.trim() : ''

  return {
    id: `rating:${rating.id ?? rating.taskAssignmentId ?? crypto.randomUUID()}`,
    date: typeof rating.createdAt === 'string' ? rating.createdAt : null,
    summary: comment || 'Evaluare primita pentru o interactiune finalizata.',
    rating: ratingValue,
  }
}

function readInteractionAssignmentId(entry: InteractionResponseType) {
  const candidates = [entry.taskAssignmentId, entry.id]

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0) {
      return candidate
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      const parsedValue = Number(candidate.trim())
      if (Number.isInteger(parsedValue) && parsedValue > 0) {
        return parsedValue
      }
    }
  }

  return null
}

function readRatingAssignmentId(entry: RatingResponseType) {
  if (typeof entry.taskAssignmentId === 'number' && Number.isInteger(entry.taskAssignmentId)) {
    return entry.taskAssignmentId
  }

  if (typeof entry.taskAssignmentId === 'string' && entry.taskAssignmentId.trim()) {
    const parsedValue = Number(entry.taskAssignmentId.trim())
    return Number.isInteger(parsedValue) ? parsedValue : null
  }

  return null
}

function mergeHistoryEntries(
  interactions: InteractionResponseType[],
  ratings: RatingResponseType[],
) {
  const entries = interactions.map((entry) => mapInteractionToHistoryEntry(entry))
  const seenAssignmentIds = new Set(
    interactions
      .map((entry) => readInteractionAssignmentId(entry))
      .filter((assignmentId): assignmentId is number => assignmentId !== null),
  )

  ratings.forEach((rating) => {
    const assignmentId = readRatingAssignmentId(rating)

    if (assignmentId !== null && seenAssignmentIds.has(assignmentId)) {
      return
    }

    entries.push(mapRatingToHistoryEntry(rating))
  })

  return entries.sort((left, right) => {
    const leftTime = left.date ? new Date(left.date).getTime() : 0
    const rightTime = right.date ? new Date(right.date).getTime() : 0
    return rightTime - leftTime
  })
}

export function InteractionHistoryPage() {
  const authUser = useAuthStore((state) => state.user)

  const interactionsQuery = useQuery({
    queryKey: ['user-interactions', authUser?.id],
    enabled: Boolean(authUser?.id),
    queryFn: async () => {
      const [interactionsResponse, ratingsResponse] = await Promise.all([
        backend.users.getInteractions(authUser!.id, {
          page: 1,
          limit: 50,
        }),
        backend.ratings.getForUser(authUser!.id),
      ])

      if (!interactionsResponse.success && !ratingsResponse.success) {
        throw new Error(
          interactionsResponse.message ||
            ratingsResponse.message ||
            'Nu am putut incarca istoricul interactiunilor.',
        )
      }

      return {
        interactions: interactionsResponse.success
          ? extractInteractionItems(interactionsResponse.data) as InteractionResponseType[]
          : [],
        ratings: ratingsResponse.success
          ? extractRatings(ratingsResponse.data) as RatingResponseType[]
          : [],
      }
    },
  })

  const items = useMemo(
    () =>
      mergeHistoryEntries(
        interactionsQuery.data?.interactions ?? [],
        interactionsQuery.data?.ratings ?? [],
      ),
    [interactionsQuery.data],
  )

  return (
    <div className="bg-slate-100/70">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-[36px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 border-b border-brand-gray pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-black sm:text-3xl">
                Istoric Interactiuni si Rating-uri
              </h1>
            </div>
          </div>

          <div className="mt-6">
            {interactionsQuery.isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-brand-gray bg-slate-100/70">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-purple-light border-t-brand-purple" />
                  <p className="text-sm font-medium text-brand-gray-text">
                    Incarcam istoricul interactiunilor...
                  </p>
                </div>
              </div>
            ) : interactionsQuery.error instanceof Error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
                {interactionsQuery.error.message}
              </div>
            ) : (
              <InteractionHistoryList items={items} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default InteractionHistoryPage
