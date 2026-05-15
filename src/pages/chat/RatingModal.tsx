import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { ConversationViewerRole, RatingValue } from './types'

interface Props {
  open: boolean
  viewerRole: ConversationViewerRole
  targetUserId: string
  targetUserName: string
  onSkip: () => void
  onSubmit: (rating: RatingValue, targetUserId: string) => void
}

const STAR_VALUES: RatingValue[] = [1, 2, 3, 4, 5]

export function RatingModal({
  open,
  viewerRole,
  targetUserId,
  targetUserName,
  onSkip,
  onSubmit,
}: Props) {
  const [selectedRating, setSelectedRating] = useState<0 | RatingValue>(0)
  const [hoveredRating, setHoveredRating] = useState<0 | RatingValue>(0)
  const [targetUserIdState, setTargetUserIdState] = useState(targetUserId)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedRating(0)
    setHoveredRating(0)
    setErrorMessage('')
    setTargetUserIdState(targetUserId)
  }, [open, targetUserId])

  const title = useMemo(() => {
    return viewerRole === 'requester'
      ? `Evaluează ajutorul primit de la ${targetUserName}`
      : `Evaluează interacțiunea avută cu ${targetUserName}`
  }, [targetUserName, viewerRole])

  function handleSubmit() {
    if (selectedRating === 0) {
      setErrorMessage('Te rugăm să acorzi cel puțin o stea')
      return
    }

    setErrorMessage('')
    onSubmit(selectedRating, targetUserIdState)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onSkip()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1.5rem)] rounded-[28px] border border-brand-gray/70 bg-white p-0 sm:max-w-md"
      >
        <DialogHeader className="px-6 pt-6 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/10">
            <Star className="h-6 w-6 fill-brand-purple text-brand-purple" />
          </div>
          <DialogTitle className="text-xl font-semibold text-brand-black">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-brand-gray-text">
            Alege între 1 și 5 stele pentru a evalua experiența acestei conversații.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 pt-1 sm:px-8">
          <div
            className="flex items-center justify-center gap-2"
            onMouseLeave={() => setHoveredRating(0)}
          >
            {STAR_VALUES.map((value) => {
              const isActive = value <= (hoveredRating || selectedRating)

              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} ${value === 1 ? 'stea' : 'stele'}`}
                  onMouseEnter={() => setHoveredRating(value)}
                  onFocus={() => setHoveredRating(value)}
                  onClick={() => {
                    setSelectedRating(value)
                    setErrorMessage('')
                  }}
                  className="rounded-full p-1 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30"
                >
                  <Star
                    className={cn(
                      'h-9 w-9 transition-colors sm:h-10 sm:w-10',
                      isActive
                        ? 'fill-brand-orange text-brand-orange'
                        : 'text-brand-gray/70',
                    )}
                  />
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-center text-sm text-brand-gray-text">
            {selectedRating > 0
              ? `${selectedRating}/5 stele selectate`
              : 'Nicio stea selectată'}
          </p>

          {errorMessage && (
            <p className="mt-2 text-center text-sm font-medium text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter className="rounded-b-[28px] border-t border-brand-gray/70 bg-brand-cream/45 px-6 py-6 sm:px-8">
          <Button type="button" variant="outline" onClick={onSkip}>
            Omite
          </Button>
          <Button type="button" variant="auth" onClick={handleSubmit}>
            Trimite Evaluarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
