import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-[28px] border border-brand-gray bg-white p-0 shadow-2xl">
        <div className="px-6 pb-2 pt-6 sm:px-7 sm:pt-7">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-xl font-bold text-brand-black">
              Anulează cererea?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm leading-6 text-brand-gray-text">
              Ești sigur că vrei să anulezi această cerere? Acțiunea este ireversibilă și
              voluntarii nu o vor mai putea vedea.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-gray-text">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <AlertDialogFooter className="rounded-b-[28px] border-t border-brand-gray/70 bg-brand-cream/35 px-6 py-5 sm:px-7">
          <AlertDialogCancel disabled={isSubmitting} variant="outline">
            Nu
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault()
              if (!isSubmitting) {
                onConfirm()
              }
            }}
            variant="destructive"
          >
            {isSubmitting ? 'Se anulează...' : 'Da, anulează'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CancelRequestDialog
