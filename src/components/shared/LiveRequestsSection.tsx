import { useState } from 'react'
import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

import { type LiveRequestCardData, LiveRequestCard } from './LiveRequestCard'

type LiveRequestsTab = 'mine' | 'volunteer'

export interface LiveRequestsSectionProps {
  isGuest: boolean
  myRequests?: LiveRequestCardData[] | null
  volunteerRequests?: LiveRequestCardData[] | null
}

const TAB_OPTIONS: Array<{ label: string; value: LiveRequestsTab }> = [
  { label: 'Cererile Mele', value: 'mine' },
  { label: 'Feed Voluntar', value: 'volunteer' },
]

const EMPTY_MESSAGE = 'Momentan nu există cereri în această secțiune.'

function normalizeRequests(requests?: LiveRequestCardData[] | null) {
  return requests ?? []
}

export function LiveRequestsSection({
  isGuest,
  myRequests,
  volunteerRequests,
}: LiveRequestsSectionProps) {
  const [activeTab, setActiveTab] = useState<LiveRequestsTab>('mine')

  const requestsByTab: Record<LiveRequestsTab, LiveRequestCardData[]> = {
    mine: normalizeRequests(myRequests),
    volunteer: normalizeRequests(volunteerRequests),
  }

  const selectedRequests = requestsByTab[activeTab]
  const showEmptyState = isGuest || selectedRequests.length === 0
  const activePanelId = `${activeTab}-requests-panel`

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 border-b border-brand-gray pb-3" role="tablist">
        {TAB_OPTIONS.map((tab) => {
          const isActive = tab.value === activeTab
          const tabId = `${tab.value}-requests-tab`
          const panelId = `${tab.value}-requests-panel`

          return (
            <button
              key={tab.value}
              aria-controls={panelId}
              aria-selected={isActive}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition duration-200',
                isActive
                  ? 'border-brand-black bg-brand-black text-white shadow-sm'
                  : 'border-brand-gray bg-white text-brand-gray-text hover:border-brand-purple hover:text-brand-black',
              )}
              id={tabId}
              onClick={() => setActiveTab(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        aria-labelledby={`${activeTab}-requests-tab`}
        className="mt-5 rounded-[28px] border border-brand-gray/80 bg-brand-cream/35 p-3 sm:p-4"
        id={activePanelId}
        role="tabpanel"
      >
        {showEmptyState ? (
          <Empty className="min-h-[220px] rounded-[22px] border border-dashed border-brand-gray bg-white">
            <EmptyHeader>
              <EmptyMedia
                className="flex size-11 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple-dark [&_svg:not([class*='size-'])]:size-5"
                variant="default"
              >
                <Inbox />
              </EmptyMedia>
              <EmptyTitle className="text-base font-semibold text-brand-black">
                {EMPTY_MESSAGE}
              </EmptyTitle>
            </EmptyHeader>
            <EmptyContent className="text-sm text-brand-gray-text">
              Schimbă tab-ul sau revino mai târziu pentru cereri noi.
            </EmptyContent>
          </Empty>
        ) : (
          <div className="max-h-[520px] overflow-y-auto pr-1 scroll-smooth">
            <div className="grid grid-cols-1 gap-4">
              {selectedRequests.map((request) => (
                <LiveRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveRequestsSection
