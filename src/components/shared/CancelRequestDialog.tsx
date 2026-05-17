import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'

interface CancelRequestDialogProps {
  open: boolean
  isSubmitting?: boolean
  errorMessage?: string | null
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function CancelRequestDialog({
  open,
  isSubmitting = false,
  errorMessage,
  onConfirm,
  onOpenChange,
}: CancelRequestDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return
    }

    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isSubmitting, onOpenChange, open])

  if (!open) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-black/18 px-4 py-6 supports-backdrop-filter:backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) {
          onOpenChange(false)
        }
      }}
      role="alertdialog"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[30px] border border-brand-gray/80 bg-white shadow-[0_28px_90px_rgba(26,26,26,0.16)]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !isSubmitting) {
            event.preventDefault()
            onOpenChange(false)
          }
        }}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="px-6 pb-4 pt-6 sm:px-7 sm:pb-5 sm:pt-7">
          <div className="grid place-items-start gap-1.5 text-left">
            <h2 className="text-xl font-bold text-brand-black">Anulează cererea?</h2>
            <p className="mt-2 text-sm leading-6 text-brand-gray-text">
              Ești sigur că vrei să anulezi această cerere? Acțiunea este ireversibilă și
              voluntarii nu o vor mai putea vedea.
            </p>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-gray-text">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-brand-gray/70 bg-brand-cream/45 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Nu
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => {
              if (!isSubmitting) {
                onConfirm()
              }
            }}
            variant="destructive"
          >
            {isSubmitting ? 'Se anulează...' : 'Da, anulează'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CancelRequestDialog
