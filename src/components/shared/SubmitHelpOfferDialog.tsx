import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import type { LiveRequestCardData } from './LiveRequestCard'

interface SubmitHelpOfferDialogProps {
  open: boolean
  request: LiveRequestCardData | null
  submitting?: boolean
  errorMessage?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (message: string) => void
}

export function SubmitHelpOfferDialog({
  open,
  request,
  submitting = false,
  errorMessage,
  onOpenChange,
  onSubmit,
}: SubmitHelpOfferDialogProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setMessage('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-[32px] border border-brand-gray/80 bg-white p-0 shadow-2xl sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-brand-gray/70 bg-brand-purple-light/45 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold text-brand-black sm:text-2xl">
                Trimite oferta
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-brand-gray-text sm:text-[0.95rem]">
                {request?.title?.trim()
                  ? `Trimite o oferta pentru cererea "${request.title}". Dupa acceptare, conversatia va porni automat.`
                  : 'Trimite o oferta catre aceasta cerere. Dupa acceptare, conversatia va porni automat.'}
              </DialogDescription>
            </div>
            <Button
              aria-label="Inchide dialogul de oferta"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
              size="icon-sm"
              variant="ghost"
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-7">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-black" htmlFor="volunteer-offer-message">
              Mesaj pentru requester
            </label>
            <Textarea
              id="volunteer-offer-message"
              maxLength={500}
              placeholder="Scrie pe scurt cum poti ajuta si in cat timp."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="text-xs text-brand-gray-text">{message.trim().length}/500 caractere</p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Anuleaza
            </Button>
            <Button
              className="w-full sm:min-w-[160px] sm:w-auto"
              disabled={submitting}
              onClick={() => onSubmit(message.trim())}
              variant="auth"
            >
              {submitting ? 'Se trimite...' : 'Trimite oferta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitHelpOfferDialog
