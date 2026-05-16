import { Loader2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'

type PendingAction = 'accept' | 'decline' | null

export interface AcceptVolunteerModalProps {
  volunteerName: string
  averageRating: number
  isOpen: boolean
  onClose: () => void
  onAccept: () => Promise<void> | void
  onDecline: () => Promise<void> | void
}

export function AcceptVolunteerModal({
  volunteerName,
  averageRating,
  isOpen,
  onClose,
  onAccept,
  onDecline,
}: AcceptVolunteerModalProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  useEffect(() => {
    setPendingAction(null)
  }, [averageRating, isOpen, volunteerName])

  if (!isOpen) {
    return null
  }

  const displayName = volunteerName.trim() || 'Voluntar anonim'
  const normalizedRating = Number.isFinite(averageRating)
    ? Math.min(5, Math.max(0, averageRating))
    : 0
  const isLoading = pendingAction !== null

  async function handleAction(action: Exclude<PendingAction, null>) {
    setPendingAction(action)

    try {
      if (action === 'accept') {
        await onAccept()
        return
      }

      await onDecline()
    } finally {
      setPendingAction(null)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isLoading) {
      onClose()
    }
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          data-testid="accept-volunteer-overlay"
        />
        <DialogPrimitive.Content
          aria-describedby="accept-volunteer-description"
          aria-labelledby="accept-volunteer-title"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-white p-6 shadow-2xl outline-none sm:p-8"
          data-testid="accept-volunteer-dialog"
        >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-purple">
            Interventie disponibila
          </p>
          <DialogPrimitive.Title
            id="accept-volunteer-title"
            className="mt-3 text-2xl font-bold tracking-tight text-brand-black sm:text-3xl"
          >
            Un voluntar vrea sa te ajute!
          </DialogPrimitive.Title>
          <DialogPrimitive.Description
            id="accept-volunteer-description"
            className="mt-3 text-sm leading-6 text-brand-gray-text sm:text-base"
          >
            <span className="font-semibold text-brand-black">{displayName}</span> este pregatit
            sa intervina pentru cererea ta.
          </DialogPrimitive.Description>
        </div>

        <div
          aria-label={`Scorul voluntarului este ${normalizedRating.toFixed(1)} din 5`}
          className="mt-8 rounded-[28px] border border-brand-purple/15 bg-brand-purple-light/60 px-6 py-7 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-purple/80">
            Scorul voluntarului
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-6xl font-black tracking-[-0.08em] text-brand-black">
              {normalizedRating.toFixed(1)}
            </span>
            <Star
              aria-hidden="true"
              className="h-12 w-12 fill-[#F5B942] text-[#F5B942]"
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => void handleAction('accept')}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-brand-purple px-5 py-4 text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'accept' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Se confirma...
              </>
            ) : (
              'Accepta ajutorul'
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleAction('decline')}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-transparent px-5 py-4 text-base font-semibold text-brand-gray-text transition hover:bg-brand-cream hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'decline' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Se refuza...
              </>
            ) : (
              'Refuza'
            )}
          </button>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default AcceptVolunteerModal
