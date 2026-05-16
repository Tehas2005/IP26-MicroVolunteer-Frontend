import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import AnimatedCharacters from '@/components/shared/AnimatedCharacters'
import HelpOffersInboxDialog from '@/components/shared/HelpOffersInboxDialog'
import LiveRequestsSection from '@/components/shared/LiveRequestsSection'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import SubmitHelpOfferDialog from '@/components/shared/SubmitHelpOfferDialog'
import VolunteerNotificationStack from '@/components/shared/VolunteerNotificationStack'
import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import {
  extractOfferList,
  mapOfferToHelpOffer,
  readOfferTaskId,
  readOfferVolunteerId,
  type HelpOfferData,
} from '@/lib/helpOffers'
import {
  extractTaskPayload,
  extractTasksList,
  isTaskOwnedByCurrentUser,
  mapTaskToLiveRequestCard,
  readCreatedTaskIds,
} from '@/lib/liveRequests'
import { readGuestSessionId } from '@/lib/guestSession'
import {
  createVolunteerNotification,
  getVolunteerNotificationId,
  type VolunteerNotificationItem,
} from '@/lib/volunteerNotifications'
import type { TaskResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

const EMPTY_TASKS: TaskResponseType[] = []
const EMPTY_REQUESTS: LiveRequestCardData[] = []
const CONVERSATION_READY_STATUSES = new Set(['ASSIGNED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'])
const CHAT_READY_POLL_DELAY_MS = 600
const CHAT_READY_MAX_ATTEMPTS = 8
const MAX_OFFERS_PAGE_SIZE = 50

function normalizeTaskStatus(status: string | null | undefined) {
  return typeof status === 'string' ? status.trim().toUpperCase() : ''
}

function buildMyRequestSupportingText(task: TaskResponseType) {
  const normalizedStatus = normalizeTaskStatus(task.status)

  if (normalizedStatus === 'COMPLETED') {
    return 'Task finalizat. Conversatia ramane disponibila in chat.'
  }

  if (CONVERSATION_READY_STATUSES.has(normalizedStatus)) {
    return 'Voluntar selectat. Conversatia este disponibila in chat.'
  }

  return 'Apasa pe cerere pentru a vedea ofertele primite si a alege un voluntar.'
}

function buildGuestRequestSupportingText() {
  return 'Cererea ta de vizitator este sincronizata cu backendul si ramane vizibila in sesiunea curenta.'
}

function canOpenConversationForTask(status: string | null | undefined) {
  return CONVERSATION_READY_STATUSES.has(normalizeTaskStatus(status))
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const authUser = useAuthStore((state) => state.user)
  const guestSessionId = isGuest ? readGuestSessionId() : ''
  const [activeNotifications, setActiveNotifications] = useState<VolunteerNotificationItem[]>([])
  const [selectedMyRequestId, setSelectedMyRequestId] = useState<string | null>(null)
  const [selectedVolunteerRequest, setSelectedVolunteerRequest] = useState<LiveRequestCardData | null>(
    null,
  )
  const [volunteerOfferError, setVolunteerOfferError] = useState<string | null>(null)
  const [volunteerOfferSubmitting, setVolunteerOfferSubmitting] = useState(false)
  const [offerActionError, setOfferActionError] = useState<string | null>(null)
  const [offerActionState, setOfferActionState] = useState<{
    offerId: string
    action: 'accept' | 'reject'
  } | null>(null)
  const [pageNotice, setPageNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  )
  const seenVolunteerRequestIdsRef = useRef<Set<string>>(new Set())
  const hasInitializedVolunteerFeedRef = useRef(false)

  const { data: liveTasksData, isLoading: isLoadingLiveRequests } = useQuery({
    queryKey: ['live-requests', authUser?.id, guestSessionId],
    enabled: sessionStatus === 'ready' && (!isGuest || Boolean(guestSessionId)),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const response = isGuest
        ? await backend.guest.listTasks(guestSessionId, {
            page: 1,
            pageSize: 50,
          })
        : await backend.tasks.list({
            page: 1,
            pageSize: 50,
            order: 'DESC',
          })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut incarca cererile live.')
      }

      return extractTasksList(response.data)
    },
  })
  const liveTasks = liveTasksData ?? EMPTY_TASKS

  const { data: myPendingOffers = [] } = useQuery({
    queryKey: ['my-pending-offers', authUser?.id],
    enabled: sessionStatus === 'ready' && !isGuest && Boolean(authUser?.id),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const response = await backend.offers.listMine({
        page: 1,
        pageSize: MAX_OFFERS_PAGE_SIZE,
        status: 'PENDING',
      })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut incarca ofertele trimise.')
      }

      return extractOfferList(response.data)
    },
  })

  const pendingOfferTaskIds = useMemo(
    () => new Set(myPendingOffers.map((offer) => readOfferTaskId(offer)).filter(Boolean)),
    [myPendingOffers],
  )

  const { myRequests, volunteerFeedRequests } = useMemo(() => {
    if (isGuest) {
      return {
        myRequests: liveTasks.map((task) => {
          const hasConversation = canOpenConversationForTask(task.status)

          return {
            ...mapTaskToLiveRequestCard(task, {
              currentUserName: 'Solicitant',
              isOwnedByCurrentUser: true,
            }),
            supportingText: hasConversation
              ? 'Voluntar selectat. Apasa pe cerere pentru a intra in chat.'
              : buildGuestRequestSupportingText(),
          }
        }),
        volunteerFeedRequests: EMPTY_REQUESTS,
      }
    }

    if (!authUser) {
      return {
        myRequests: EMPTY_REQUESTS,
        volunteerFeedRequests: EMPTY_REQUESTS,
      }
    }

    const locallyTrackedTaskIds = new Set(readCreatedTaskIds(authUser.id))
    const ownedTaskIds = new Set<string>()

    const ownedTasks = liveTasks.filter((task) => {
      const isOwned = isTaskOwnedByCurrentUser(task, authUser.id, locallyTrackedTaskIds)

      if (isOwned) {
        ownedTaskIds.add(String(task.id))
      }

      return isOwned
    })

    const publicOpenTasks = liveTasks.filter((task) => {
      if (ownedTaskIds.has(String(task.id))) {
        return false
      }

      return normalizeTaskStatus(task.status) === 'OPEN'
    })

    return {
      myRequests: ownedTasks.map((task) => ({
        ...mapTaskToLiveRequestCard(task, {
          currentUserName: authUser.name,
          isOwnedByCurrentUser: true,
        }),
        supportingText: buildMyRequestSupportingText(task),
      })),
      volunteerFeedRequests: publicOpenTasks.map((task) =>
        mapTaskToLiveRequestCard(task, {
          currentUserName: authUser.name,
          isOwnedByCurrentUser: false,
        }),
      ),
    }
  }, [authUser, isGuest, liveTasks])

  useEffect(() => {
    if (isGuest || sessionStatus !== 'ready') {
      seenVolunteerRequestIdsRef.current.clear()
      hasInitializedVolunteerFeedRef.current = false
      setActiveNotifications((currentNotifications) =>
        currentNotifications.length === 0 ? currentNotifications : [],
      )
      return
    }

    if (!hasInitializedVolunteerFeedRef.current) {
      volunteerFeedRequests.forEach((request) => {
        seenVolunteerRequestIdsRef.current.add(request.id)
      })
      hasInitializedVolunteerFeedRef.current = true
      return
    }

    if (volunteerFeedRequests.length === 0) {
      return
    }

    const unseenRequests = volunteerFeedRequests.filter(
      (request) => !seenVolunteerRequestIdsRef.current.has(request.id),
    )

    if (unseenRequests.length === 0) {
      return
    }

    unseenRequests.forEach((request) => {
      seenVolunteerRequestIdsRef.current.add(request.id)
    })

    setActiveNotifications((currentNotifications) => {
      const currentNotificationIds = new Set(currentNotifications.map((item) => item.id))
      const nextNotifications = unseenRequests
        .map((request) => createVolunteerNotification(request))
        .filter((notification) => !currentNotificationIds.has(notification.id))

      return [...currentNotifications, ...nextNotifications].slice(-4)
    })
  }, [isGuest, sessionStatus, volunteerFeedRequests])

  const selectedMyRequest = useMemo(
    () => myRequests.find((request) => request.id === selectedMyRequestId) ?? null,
    [myRequests, selectedMyRequestId],
  )

  const {
    data: selectedMyRequestOffers = [],
    isLoading: isLoadingSelectedOffers,
    error: selectedOffersError,
    refetch: refetchSelectedOffers,
  } = useQuery({
    queryKey: ['task-offers', selectedMyRequest?.id],
    enabled: sessionStatus === 'ready' && !isGuest && Boolean(selectedMyRequest?.id),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: selectedMyRequest?.id ? 5000 : false,
    queryFn: async () => {
      const requestId = selectedMyRequest?.id

      if (!requestId) {
        return []
      }

      const response = await backend.offers.listForTask(requestId, {
        page: 1,
        pageSize: 50,
      })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut incarca ofertele pentru aceasta cerere.')
      }

      const offers = extractOfferList(response.data)
      const volunteerIds = Array.from(
        new Set(offers.map((offer) => readOfferVolunteerId(offer)).filter(Boolean)),
      )

      const [profiles, ratingSummaries] = await Promise.all([
        Promise.all(
          volunteerIds.map(async (volunteerId) => {
            const profileResponse = await backend.profile.getByUserId(volunteerId)
            return [volunteerId, profileResponse.success ? profileResponse.data : null] as const
          }),
        ),
        Promise.all(
          volunteerIds.map(async (volunteerId) => {
            const ratingSummaryResponse = await backend.ratings.getSummaryForUser(volunteerId)
            return [volunteerId, ratingSummaryResponse.success ? ratingSummaryResponse.data : null] as const
          }),
        ),
      ])

      const profilesById = new Map(profiles)
      const ratingSummaryById = new Map(ratingSummaries)

      return offers.map((offer) => {
        const volunteerId = readOfferVolunteerId(offer)

        return mapOfferToHelpOffer({
          offer,
          requestId,
          profile: volunteerId ? profilesById.get(volunteerId) ?? null : null,
          ratingSummary: volunteerId ? ratingSummaryById.get(volunteerId) ?? null : null,
        })
      })
    },
  })

  const handleVolunteerRequestOpen = useCallback(
    (request: LiveRequestCardData) => {
      setPageNotice(null)
      setVolunteerOfferError(null)

      if (pendingOfferTaskIds.has(request.id)) {
        setPageNotice({
          kind: 'error',
          message:
            'Ai deja o oferta in asteptare pentru aceasta cerere. Asteapta raspunsul requesterului.',
        })
        return
      }

      setSelectedVolunteerRequest(request)
    },
    [pendingOfferTaskIds],
  )

  const handleMyRequestOpen = useCallback(
    (request: LiveRequestCardData) => {
      if (isGuest) {
        const matchingTask = liveTasks.find((task) => String(task.id) === request.id)

        if (!matchingTask) {
          setPageNotice({
            kind: 'error',
            message: 'Nu am mai gasit cererea selectata. Reincarca pagina si incearca din nou.',
          })
          return
        }

        if (canOpenConversationForTask(matchingTask.status)) {
          navigate(`/chat/${request.id}`)
          return
        }

        setPageNotice({
          kind: 'error',
          message:
            'Chatul devine disponibil dupa ce un voluntar este acceptat pentru aceasta cerere.',
        })
        return
      }

      setOfferActionError(null)
      setPageNotice(null)
      setSelectedMyRequestId(request.id)
      void queryClient.invalidateQueries({ queryKey: ['task-offers', request.id] })
    },
    [isGuest, liveTasks, navigate, queryClient],
  )

  const handleVolunteerOfferSubmit = useCallback(
    async (message: string) => {
      if (!selectedVolunteerRequest) {
        return
      }

      setVolunteerOfferSubmitting(true)
      setVolunteerOfferError(null)
      setPageNotice(null)

      try {
        const response = await backend.offers.createForTask(selectedVolunteerRequest.id, {
          message: message || undefined,
        })

        if (!response.success) {
          setVolunteerOfferError(
            response.message || 'Nu am putut trimite oferta. Incearca din nou.',
          )
          return
        }

        setSelectedVolunteerRequest(null)
        setPageNotice({
          kind: 'success',
          message:
            'Oferta ta a fost trimisa. Conversatia va deveni disponibila dupa ce requesterul o accepta.',
        })
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['live-requests'] }),
          queryClient.invalidateQueries({ queryKey: ['my-pending-offers'] }),
        ])
      } finally {
        setVolunteerOfferSubmitting(false)
      }
    },
    [queryClient, selectedVolunteerRequest],
  )

  const handleOfferReject = useCallback(
    async (offer: HelpOfferData) => {
      setOfferActionState({ offerId: offer.id, action: 'reject' })
      setOfferActionError(null)
      setPageNotice(null)

      try {
        const response = await backend.offers.updateStatus(offer.id, { status: 'REJECTED' })

        if (!response.success) {
          setOfferActionError(response.message || 'Nu am putut refuza oferta.')
          return
        }

        await refetchSelectedOffers()
      } finally {
        setOfferActionState(null)
      }
    },
    [refetchSelectedOffers],
  )

  const handleOfferAccept = useCallback(
    async (offer: HelpOfferData) => {
      if (!selectedMyRequest) {
        return
      }

      setOfferActionState({ offerId: offer.id, action: 'accept' })
      setOfferActionError(null)
      setPageNotice(null)

      try {
        const response = await backend.offers.updateStatus(offer.id, { status: 'ACCEPTED' })

        if (!response.success) {
          setOfferActionError(response.message || 'Nu am putut accepta oferta.')
          return
        }

        await Promise.all([
          refetchSelectedOffers(),
          queryClient.invalidateQueries({ queryKey: ['live-requests'] }),
          queryClient.invalidateQueries({ queryKey: ['backend-conversations'] }),
        ])

        let isChatReady = false

        for (let attempt = 0; attempt < CHAT_READY_MAX_ATTEMPTS; attempt += 1) {
          const taskResponse = await backend.tasks.getById(selectedMyRequest.id)
          const task = taskResponse.success && taskResponse.data
            ? extractTaskPayload(taskResponse.data)
            : null

          if (task && canOpenConversationForTask(task.status)) {
            isChatReady = true
            break
          }

          await wait(CHAT_READY_POLL_DELAY_MS)
        }

        if (!isChatReady) {
          setPageNotice({
            kind: 'success',
            message:
              'Oferta a fost acceptata. Conversatia se pregateste inca putin; incearca din nou imediat.',
          })
        }

        navigate(`/chat/${selectedMyRequest.id}`)
      } finally {
        setOfferActionState(null)
      }
    },
    [navigate, queryClient, refetchSelectedOffers, selectedMyRequest],
  )

  const handleNotificationDismiss = useCallback((notificationId: string) => {
    setActiveNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    )
  }, [])

  const handleNotificationOpen = useCallback(
    (request: LiveRequestCardData) => {
      handleNotificationDismiss(getVolunteerNotificationId(request.id))
      handleVolunteerRequestOpen(request)
    },
    [handleNotificationDismiss, handleVolunteerRequestOpen],
  )

  return (
    <div className="bg-brand-cream">
      <VolunteerNotificationStack
        notifications={activeNotifications}
        onDismiss={handleNotificationDismiss}
        onViewDetails={handleNotificationOpen}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[52px] border border-brand-gray/80 bg-brand-purple-light">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:px-10 lg:py-14">
            <div className="flex flex-col justify-center text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-brand-black sm:text-5xl">
                Bine ai venit la Micro-Volunteer Crisis Router
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-brand-gray-text sm:text-xl">
                Conectam oamenii cu voluntari locali in momente de criza, intr-un spatiu clar,
                calm si usor de folosit.
              </p>

              <div className="mt-8 flex justify-center lg:justify-start">
                <Button
                  className="min-w-[220px] text-base"
                  onClick={() => navigate('/cere-ajutor')}
                  size="lg"
                  variant="primary"
                >
                  Cere Ajutor Acum
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[380px]">
                <div className="h-[220px] sm:h-[250px] lg:hidden">
                  <AnimatedCharacters compact mood="login" />
                </div>
                <div className="hidden min-h-[340px] lg:block">
                  <AnimatedCharacters mood="login" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <div className="rounded-[36px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-brand-gray pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red/35" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-red" />
              </span>
              <h2 className="text-2xl font-bold text-brand-black sm:text-3xl">Cereri Live</h2>
            </div>

            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate('/cere-ajutor')}
              variant="auth"
            >
              Cere Ajutor
            </Button>
          </div>

          {pageNotice ? (
            <div
              className={[
                'mt-5 rounded-2xl px-4 py-3 text-sm',
                pageNotice.kind === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700',
              ].join(' ')}
            >
              {pageNotice.message}
            </div>
          ) : null}

          <LiveRequestsSection
            isLoading={isLoadingLiveRequests}
            myRequests={myRequests}
            onMyRequestOpen={handleMyRequestOpen}
            onVolunteerRequestOpen={isGuest ? undefined : handleVolunteerRequestOpen}
            volunteerRequests={volunteerFeedRequests}
          />
        </div>
      </section>

      <HelpOffersInboxDialog
        busyAction={offerActionState?.action ?? null}
        busyOfferId={offerActionState?.offerId ?? null}
        errorMessage={
          offerActionError ||
          (selectedOffersError instanceof Error ? selectedOffersError.message : null)
        }
        offers={isLoadingSelectedOffers ? [] : selectedMyRequestOffers}
        onAccept={(offer) => void handleOfferAccept(offer)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMyRequestId(null)
            setOfferActionError(null)
          }
        }}
        onReject={(offer) => void handleOfferReject(offer)}
        open={selectedMyRequest !== null}
        request={selectedMyRequest}
      />

      <SubmitHelpOfferDialog
        errorMessage={volunteerOfferError}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVolunteerRequest(null)
            setVolunteerOfferError(null)
          }
        }}
        onSubmit={(message) => void handleVolunteerOfferSubmit(message)}
        open={selectedVolunteerRequest !== null}
        request={selectedVolunteerRequest}
        submitting={volunteerOfferSubmitting}
      />
    </div>
  )
}

export default HomePage
