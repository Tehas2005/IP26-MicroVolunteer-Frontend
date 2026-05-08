import { useMemo } from 'react'
import { History } from 'lucide-react'

import InteractionHistoryList from '@/components/shared/InteractionHistoryList'
import { getMockInteractionHistory } from '@/lib/interactionHistory'
import { useAuthStore } from '@/store/authStore'

export function InteractionHistoryPage() {
  const authUser = useAuthStore((state) => state.user)
  const items = useMemo(() => getMockInteractionHistory(authUser), [authUser])

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
              <p className="mt-1 text-sm text-brand-gray-text sm:text-base">
                Vezi interactiunile incheiate si evaluarea asociata fiecarei experiente.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <InteractionHistoryList items={items} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default InteractionHistoryPage
