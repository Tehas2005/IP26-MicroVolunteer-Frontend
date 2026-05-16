import { History } from 'lucide-react'

import type { InteractionHistoryEntry } from '@/lib/interactionHistory'

import InteractionHistoryCard from './InteractionHistoryCard'

interface InteractionHistoryListProps {
  items: InteractionHistoryEntry[]
}

const EMPTY_MESSAGE = 'Nu ai nicio interactiune trecuta.'

export function InteractionHistoryList({ items }: InteractionHistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-100/70 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500">
          <History className="h-6 w-6" />
        </div>
        <p className="text-base font-medium text-slate-600">{EMPTY_MESSAGE}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <InteractionHistoryCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export default InteractionHistoryList
