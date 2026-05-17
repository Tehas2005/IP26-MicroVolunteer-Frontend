import { Clock3, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { LiveRequestCardData } from './LiveRequestCard'
import { formatHelpOfferRelativeTime, type HelpOfferData } from '@/lib/helpOffers'

interface HelpOffersInboxDialogProps {
  errorMessage?: string | null
  isLoading?: boolean
  open: boolean
  request: LiveRequestCardData | null
  offers: HelpOfferData[]
  onAccept: (offer: HelpOfferData) => void
  onOpenChange: (open: boolean) => void
  onReject: (offer: HelpOfferData) => void
}

function getOfferStatusLabel(offer: HelpOfferData, acceptedOfferId: string | null) {
  if (offer.status === 'accepted') {
    return 'Acceptată'
  }

  if (offer.status === 'rejected') {
    return 'Refuzată'
  }

  if (acceptedOfferId && acceptedOfferId !== offer.id) {
    return 'Inactivă'
  }

  return 'În așteptare'
}

export function HelpOffersInboxDialog({
  errorMessage,
  isLoading = false,
  open,
  request,
  offers,
  onAccept,
  onOpenChange,
  onReject,
}: HelpOffersInboxDialogProps) {
  const acceptedOfferId = offers.find((offer) => offer.status === 'accepted')?.id ?? null
  const acceptedOffer = acceptedOfferId
    ? offers.find((offer) => offer.id === acceptedOfferId) ?? null
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(88vh,760px)] max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-[32px] border border-brand-gray/80 bg-white p-0 shadow-2xl sm:max-w-3xl"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-brand-gray/70 bg-brand-purple-light/45 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold text-brand-black sm:text-2xl">
                Oferte primite
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-brand-gray-text sm:text-[0.95rem]">
                {request?.title?.trim()
                  ? `Alege cine preia cererea "${request.title}". După acceptare, conversația pornește automat în chat.`
                  : 'Alege voluntarul potrivit și continuă direct în chat.'}
              </DialogDescription>
            </div>
            <Button
              aria-label="Închide ofertele"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
              size="icon-sm"
              variant="ghost"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>

          {acceptedOffer ? (
            <div className="mt-4 rounded-2xl border border-brand-purple/15 bg-white/80 px-4 py-3 text-sm text-brand-purple-dark">
              Ai acceptat deja oferta lui{' '}
              <span className="font-semibold">{acceptedOffer.volunteerName}</span>. Celelalte
              răspunsuri rămân inactive.
            </div>
          ) : null}
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          data-testid="help-offers-scroll-area"
        >
          {isLoading ? (
            <div className="rounded-[28px] border border-dashed border-brand-gray bg-brand-cream/50 px-6 py-10 text-center">
              <p className="text-base font-semibold text-brand-black">Se încarcă ofertele...</p>
              <p className="mt-2 text-sm text-brand-gray-text">
                Verificăm răspunsurile primite pentru această cerere.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-brand-red/20 bg-brand-red/5 px-6 py-10 text-center">
              <p className="text-base font-semibold text-brand-black">
                Nu am putut încărca ofertele.
              </p>
              <p className="mt-2 text-sm text-brand-gray-text">{errorMessage}</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-brand-gray bg-brand-cream/50 px-6 py-10 text-center">
              <p className="text-base font-semibold text-brand-black">Nu ai oferte încă.</p>
              <p className="mt-2 text-sm text-brand-gray-text">
                Revino în curând pentru voluntari compatibili.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const isAccepted = offer.status === 'accepted'
                const isRejected = offer.status === 'rejected'
                const isLocked = Boolean(acceptedOfferId && acceptedOfferId !== offer.id)
                const disableAccept = isAccepted || isRejected || isLocked
                const disableReject = isAccepted || isRejected || isLocked

                return (
                  <article
                    key={offer.id}
                    className={cn(
                      'rounded-[28px] border bg-[#F8FAFD] p-5 shadow-sm transition-all duration-200',
                      isAccepted
                        ? 'border-brand-purple/40 bg-brand-purple-light/35 shadow-[0_10px_24px_rgba(123,47,190,0.12)]'
                        : 'border-brand-gray/80 hover:border-brand-purple/25 hover:shadow-[0_10px_24px_rgba(26,26,26,0.06)]',
                      (isRejected || isLocked) && 'opacity-70',
                    )}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-brand-black">
                              {offer.volunteerName}
                            </h3>
                            <span
                              className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                isAccepted
                                  ? 'bg-brand-purple text-white'
                                  : isRejected
                                    ? 'bg-brand-gray/30 text-brand-gray-text'
                                    : isLocked
                                      ? 'bg-brand-gray/20 text-brand-gray-text'
                                      : 'bg-white text-brand-black',
                              )}
                            >
                              {getOfferStatusLabel(offer, acceptedOfferId)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-brand-gray-text">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-4 w-4" />
                              {formatHelpOfferRelativeTime(offer.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-medium text-brand-black">
                              <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                              {offer.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="hidden shrink-0 sm:block">
                          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-purple-dark">
                            HelpOffer
                          </div>
                        </div>
                      </div>

                      <p className="text-sm leading-7 text-brand-gray-text sm:text-[0.95rem]">
                        {offer.message}
                      </p>

                      {isLocked ? (
                        <p className="text-sm font-medium text-brand-gray-text">
                          O altă ofertă a fost deja acceptată pentru această cerere.
                        </p>
                      ) : null}

                      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                        <Button
                          className="w-full sm:w-auto"
                          disabled={disableReject}
                          onClick={() => onReject(offer)}
                          variant="outline"
                        >
                          {isRejected ? 'Refuzată' : 'Refuză'}
                        </Button>
                        <Button
                          className="w-full sm:min-w-[140px] sm:w-auto"
                          disabled={disableAccept}
                          onClick={() => onAccept(offer)}
                          variant="auth"
                        >
                          {isAccepted ? 'Acceptată' : 'Acceptă'}
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HelpOffersInboxDialog
