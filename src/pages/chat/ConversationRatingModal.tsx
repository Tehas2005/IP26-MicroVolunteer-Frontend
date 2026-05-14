import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RatingValue } from './types'

interface ConversationRatingModalProps {
  isOpen: boolean
  targetName: string
  targetUserId: string | null
  viewerRole: 'requester' | 'volunteer'
  onSubmit: (stars: RatingValue, targetUserId: string) => void
  onSkip: () => void
}

const STAR_VALUES: RatingValue[] = [1, 2, 3, 4, 5]

function getDialogTitle(viewerRole: 'requester' | 'volunteer', targetName: string) {
  return viewerRole === 'requester'
    ? `Evalueaza ajutorul primit de la ${targetName}`
    : `Evalueaza interactiunea avuta cu ${targetName}`
}

export function ConversationRatingModal({
  isOpen,
  targetName,
  targetUserId,
  viewerRole,
  onSubmit,
  onSkip,
}: ConversationRatingModalProps) {
  const [hoveredStars, setHoveredStars] = useState(0)
  const [selectedStars, setSelectedStars] = useState<0 | RatingValue>(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setHoveredStars(0)
      setSelectedStars(0)
      setErrorMessage('')
    }
  }, [isOpen])

  const dialogTitle = useMemo(
    () => getDialogTitle(viewerRole, targetName.trim() || 'utilizatorul'),
    [targetName, viewerRole],
  )

  const previewStars = hoveredStars || selectedStars

  function handleSubmit() {
    if (!selectedStars) {
      setErrorMessage('Te rugam sa acorzi cel putin o stea')
      return
    }

    if (!targetUserId) {
      return
    }

    setErrorMessage('')
    onSubmit(selectedStars, targetUserId)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[28px] border border-brand-gray bg-white p-0 sm:max-w-lg"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="gap-3 px-6 pt-6 text-center sm:px-8 sm:pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
            <Star className="h-7 w-7 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold leading-tight text-brand-black sm:text-2xl">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-brand-gray-text">
            Alege intre 1 si 5 stele pentru a evalua experienta acestei conversatii.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex items-center justify-center gap-2"
              onMouseLeave={() => setHoveredStars(0)}
            >
              {STAR_VALUES.map((starValue) => {
                const isActive = starValue <= previewStars

                return (
                  <button
                    key={starValue}
                    type="button"
                    aria-label={`${starValue} stele`}
                    aria-pressed={selectedStars === starValue}
                    className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
                    onClick={() => {
                      setSelectedStars(starValue)
                      setErrorMessage('')
                    }}
                    onMouseEnter={() => setHoveredStars(starValue)}
                  >
                    <Star
                      className={cn(
                        'h-10 w-10 transition-colors sm:h-12 sm:w-12',
                        isActive
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-brand-gray/60',
                      )}
                    />
                  </button>
                )
              })}
            </div>

            <p className="text-sm font-medium text-brand-gray-text">
              {selectedStars ? `${selectedStars}/5 stele selectate` : 'Selecteaza un rating'}
            </p>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-brand-gray/70 bg-brand-cream/70 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <Button type="button" variant="outline" onClick={onSkip}>
            Omite
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            Trimite Evaluarea
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConversationRatingModal
