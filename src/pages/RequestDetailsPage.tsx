import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, Headphones, Languages, ShieldAlert, StickyNote } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import {
  readRequestDetails,
  readTaskAudioUrl,
  readTaskCategoryLabel,
  readTaskTextDescription,
  readTaskUrgencyMeta,
  UNSPECIFIED_REQUEST_DETAIL,
} from '@/lib/requestDetails'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <article className="rounded-[28px] border border-brand-gray/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-brand-purple-light p-3 text-brand-purple-dark">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-gray-text">
            {label}
          </p>
          <p className="mt-2 text-sm leading-7 text-brand-black/85">{value}</p>
        </div>
      </div>
    </article>
  )
}

export function RequestDetailsPage() {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const isGuest = useAuthStore((state) => state.isGuest)
  const authUser = useAuthStore((state) => state.user)
  const volunteerProfile = useVolunteerProfileStore((state) =>
    authUser?.id ? state.profilesByUserId[authUser.id] : undefined,
  )
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)

  const {
    data: task,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['request-details', taskId],
    enabled: Boolean(taskId),
    retry: false,
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Cererea nu a putut fi identificata.')
      }

      const response = await backend.tasks.getById(taskId)

      if (!response.success || !response.data) {
        throw new Error(
          response.isUnauthorized
            ? 'Trebuie sa fii autentificat pentru a vedea detaliile acestei cereri.'
            : response.message || 'Nu am putut incarca detaliile cererii.',
        )
      }

      return response.data
    },
  })

  const requestDetails = useMemo(() => readRequestDetails(task), [task])
  const audioUrl = useMemo(() => readTaskAudioUrl(task), [task])
  const visibleDescription = useMemo(() => readTaskTextDescription(task), [task])
  const urgency = useMemo(() => readTaskUrgencyMeta(task?.urgency), [task])
  const categoryLabel = useMemo(() => readTaskCategoryLabel(task?.category), [task])
  const title = task?.title?.trim() || 'Cerere fara titlu'

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  function handleHelpAction() {
    if (isGuest || !authUser || !volunteerProfile) {
      setIsAccessDialogOpen(true)
      return
    }

    setIsOfferDialogOpen(true)
  }

  return (
    <section className="bg-brand-cream pb-36">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-brand-gray bg-white px-4 py-2 text-sm font-semibold text-brand-black transition hover:border-brand-purple/35 hover:text-brand-purple-dark"
          onClick={handleBack}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la cereri live
        </button>

        <div className="mt-5 overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-purple-light border-t-brand-purple" />
                <p className="text-sm font-medium text-brand-gray-text">
                  Incarcam detaliile cererii...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-12 sm:px-8">
              <div className="mx-auto max-w-2xl rounded-[28px] border border-brand-red/20 bg-brand-red/5 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-red shadow-sm">
                  <CircleAlert className="h-7 w-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold text-brand-black">
                  Nu am putut incarca cererea
                </h1>
                <p className="mt-3 text-sm leading-7 text-brand-gray-text">
                  {error instanceof Error
                    ? error.message
                    : 'A aparut o eroare neasteptata la incarcarea detaliilor.'}
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button onClick={() => refetch()} variant="auth">
                    Incearca din nou
                  </Button>
                  <Button onClick={handleBack} variant="ghost">
                    Revino la feed
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-brand-gray/80 bg-brand-purple-light/30 px-6 py-8 sm:px-8 lg:px-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${urgency.badgeClassName}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${urgency.accentClassName}`} />
                    {urgency.label}
                  </span>
                  <span className="rounded-full border border-brand-gray bg-white px-4 py-2 text-sm font-semibold text-brand-black">
                    {categoryLabel}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
                  {title}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-brand-gray-text sm:text-lg">
                  {visibleDescription ||
                    (audioUrl
                      ? 'Cererea include un mesaj vocal. Il poti asculta in sectiunea audio de mai jos.'
                      : UNSPECIFIED_REQUEST_DETAIL)}
                </p>
              </div>

              <div className="px-6 py-8 sm:px-8 lg:px-10">
                <div className="grid gap-5 lg:grid-cols-3">
                  <DetailCard
                    icon={<StickyNote className="h-5 w-5" />}
                    label="Notite"
                    value={requestDetails.notes}
                  />
                  <DetailCard
                    icon={<Languages className="h-5 w-5" />}
                    label="Limba necesara"
                    value={requestDetails.languageNeeded}
                  />
                  <DetailCard
                    icon={<ShieldAlert className="h-5 w-5" />}
                    label="Notite de siguranta"
                    value={requestDetails.safetyNotes}
                  />
                </div>

                {audioUrl ? (
                  <div className="mt-6 rounded-[28px] border border-brand-gray/80 bg-brand-black px-5 py-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3 text-white">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                          Mesaj audio
                        </p>
                        <p className="mt-1 text-sm text-white/80">
                          Poti asculta mesajul vocal trimis impreuna cu cererea.
                        </p>
                      </div>
                    </div>

                    <audio className="mt-5 w-full" controls preload="metadata" src={audioUrl} />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {!isLoading && !error && task ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-gray/80 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(26,26,26,0.08)] backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-brand-black">Ai parcurs toate detaliile?</p>
              <p className="text-sm text-brand-gray-text">
                Daca poti interveni, continua cu pasul de ajutor.
              </p>
            </div>

            <Button className="w-full sm:w-auto sm:min-w-[260px]" onClick={handleHelpAction} size="lg" variant="auth">
              Vreau sa ajut
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog onOpenChange={setIsAccessDialogOpen} open={isAccessDialogOpen}>
        <DialogContent className="rounded-[28px] p-0 sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-bold text-brand-black">
              Acces restrictionat
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-7 text-brand-gray-text">
              Trebuie sa fii logat si sa ai cont de voluntar pentru a accepta cereri.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-b-[28px] px-6">
            <Button onClick={() => setIsAccessDialogOpen(false)} variant="auth">
              Am inteles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsOfferDialogOpen} open={isOfferDialogOpen}>
        <DialogContent className="rounded-[28px] p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-bold text-brand-black">
              Oferta de ajutor
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-7 text-brand-gray-text">
              Din aceasta pagina se deschide fluxul de trimitere a ofertei. Formularul complet de
              introducere se va continua aici in pasul urmator al functionalitatii.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-b-[28px] px-6">
            <Button onClick={() => setIsOfferDialogOpen(false)} variant="ghost">
              Inchide
            </Button>
            <Button onClick={() => setIsOfferDialogOpen(false)} variant="auth">
              Continua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default RequestDetailsPage
