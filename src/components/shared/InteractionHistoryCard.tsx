import { CalendarDays } from 'lucide-react'

import { formatInteractionDate, getInteractionSummary, type InteractionHistoryEntry } from '@/lib/interactionHistory'

import RatingStars from './RatingStars'

interface InteractionHistoryCardProps {
  item: InteractionHistoryEntry
}

export function InteractionHistoryCard({ item }: InteractionHistoryCardProps) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-slate-100/80 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{formatInteractionDate(item.date)}</span>
          </div>

          <p className="mt-3 text-base leading-7 text-slate-800">
            {getInteractionSummary(item.summary)}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <RatingStars value={item.rating} />
        </div>
      </div>
    </article>
  )
}

export default InteractionHistoryCard
