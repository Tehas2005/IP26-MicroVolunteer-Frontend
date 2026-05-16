import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'

import InteractionHistoryList from '@/components/shared/InteractionHistoryList'
import { backend } from '@/lib/backend'
import { mapInteractionToHistoryEntry } from '@/lib/interactionHistory'
import { useAuthStore } from '@/store/authStore'

export function InteractionHistoryPage() {
  const authUser = useAuthStore((state) => state.user)

  const interactionsQuery = useQuery({
    queryKey: ['user-interactions', authUser?.id],
    enabled: Boolean(authUser?.id),
    queryFn: async () => {
      const response = await backend.users.getInteractions(authUser!.id, {
        page: 1,
        limit: 50,
      })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut incarca istoricul interactiunilor.')
      }

      return Array.isArray(response.data) ? response.data : []
    },
  })

  const items = useMemo(
    () => (interactionsQuery.data ?? []).map((entry) => mapInteractionToHistoryEntry(entry)),
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
