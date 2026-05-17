import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import AcceptVolunteerModal from '@/components/modals/AcceptVolunteerModal'
import AnimatedCharacters from '@/components/shared/AnimatedCharacters'
import CancelRequestDialog from '@/components/shared/CancelRequestDialog'
import HelpOffersInboxDialog from '@/components/shared/HelpOffersInboxDialog'
import LiveRequestsSection from '@/components/shared/LiveRequestsSection'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import VolunteerNotificationStack from '@/components/shared/VolunteerNotificationStack'
import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import { ensureGuestSessionId, getGuestSessionId } from '@/lib/guestSession'
import {
  extractTasksList,
  isTaskOwnedByCurrentUser,
  mapTaskToLiveRequestCard,
  readCreatedTaskIds,
} from '@/lib/liveRequests'
import {
  cancelMockRequestConversations,
  ensureMockConversation,
  ensureMockConversationForAcceptedOffer,
  resolveChatViewerIdentity,
} from '@/lib/mockChat'
import {
  getReceivedOffersSummary,
  listMockHelpOffers,
  updateMockHelpOfferStatus,
  type HelpOfferData,
} from '@/lib/mockHelpOffers'
import { cancelMockLiveRequest, getMockLiveRequestSections } from '@/lib/mockLiveRequests'
import {
  createVolunteerNotification,
  getVolunteerNotificationId,
  type VolunteerNotificationItem,
} from '@/lib/volunteerNotifications'
import type { TaskResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

const EMPTY_TASKS: TaskResponseType[] = []
const EMPTY_REQUESTS: LiveRequestCardData[] = []

type OfferDecisionState = {
  offer: HelpOfferData
  request: LiveRequestCardData
}

export function HomePage() {
  const navigate = useNavigate()
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const authUser = useAuthStore((state) => state.user)
  const viewerIdentity = useMemo(() => resolveChatViewerIdentity(authUser), [authUser])
  const [guestSessionId, setGuestSessionId] = useState<string | null>(() =>
    isGuest ? getGuestSessionId() : null,
  )
  const [activeNotifications, setActiveNotifications] = useState<VolunteerNotificationItem[]>([])
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null)
  const [cancelledRequestIds, setCancelledRequestIds] = useState<string[]>([])
  const [isCancellingRequest, setIsCancellingRequest] = useState(false)
  const [offerDecisionState, setOfferDecisionState] = useState<OfferDecisionState | null>(null)
  const [requestPendingCancellation, setRequestPendingCancellation] = useState<LiveRequestCardData | null>(null)
  const [selectedMyRequestId, setSelectedMyRequestId] = useState<string | null>(null)
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null)
  const [offersRevision, setOffersRevision] = useState(0)
  const seenVolunteerRequestIdsRef = useRef<Set<string>>(new Set())
  const hasInitializedVolunteerFeedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    if (!isGuest) {
      setGuestSessionId(null)
      return () => {
        isMounted = false
      }
    }

    setGuestSessionId(getGuestSessionId())

    void ensureGuestSessionId().then((nextGuestSessionId) => {
      if (!isMounted) {
        return
      }

      setGuestSessionId(nextGuestSessionId)
    })

    return () => {
      isMounted = false
    }
  }, [isGuest])

  const { data: liveTasksData, isLoading: isLoadingLiveRequests, refetch: refetchLiveRequests } = useQuery({
    queryKey: ['live-requests', authUser?.id, guestSessionId],
    enabled: sessionStatus === 'ready' && (!isGuest || Boolean(guestSessionId)),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const requestFilters = {
        page: 1,
        pageSize: 50,
        order: 'DESC',
      }
      const response =
        isGuest && guestSessionId
          ? await backend.tasks.listGuest(guestSessionId, requestFilters)
          : await backend.tasks.list(requestFilters)

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut încărca cererile live.')
      }

      return extractTasksList(response.data)
    },
  })
  const liveTasks = liveTasksData ?? EMPTY_TASKS

  const { myRequests, volunteerFeedRequests } = useMemo(() => {
    if (isGuest) {
      return {
        myRequests: liveTasks.map((task) => {
          const request = mapTaskToLiveRequestCard(task, {
            currentUserName: 'Solicitant',
            isOwnedByCurrentUser: true,
          })

          return {
            ...request,
            requesterKey: viewerIdentity.key,
            requesterKind: 'guest' as const,
            requesterLabel: viewerIdentity.displayName,
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
      const isOwnedByCurrentUser = isTaskOwnedByCurrentUser(task, authUser.id, locallyTrackedTaskIds)

      if (isOwnedByCurrentUser) {
        ownedTaskIds.add(String(task.id))
      }

      return isOwnedByCurrentUser
    })

    const publicTasks = liveTasks.filter((task) => !ownedTaskIds.has(String(task.id)))

    return {
      myRequests: ownedTasks.map((task) =>
        mapTaskToLiveRequestCard(task, {
          currentUserId: authUser.id,
          currentUserName: authUser.name,
          isOwnedByCurrentUser: true,
        }),
      ),
      volunteerFeedRequests: publicTasks.map((task) =>
        mapTaskToLiveRequestCard(task, {
          currentUserId: authUser.id,
          currentUserName: authUser.name,
          isOwnedByCurrentUser: false,
        }),
      ),
    }
  }, [authUser, isGuest, liveTasks, viewerIdentity])

  const mockLiveRequests = useMemo(() => getMockLiveRequestSections(authUser), [authUser])
  const shouldUseMockLiveRequests =
    !isLoadingLiveRequests && myRequests.length === 0 && volunteerFeedRequests.length === 0
  const cancelledRequestIdsSet = useMemo(
    () => new Set(cancelledRequestIds),
    [cancelledRequestIds],
  )

  const displayedMyRequests = (
    shouldUseMockLiveRequests ? mockLiveRequests.myRequests : myRequests
  ).filter((request) => !cancelledRequestIdsSet.has(request.id))
  const displayedVolunteerRequests = shouldUseMockLiveRequests
    ? mockLiveRequests.volunteerRequests
    : volunteerFeedRequests

  useEffect(() => {
    if (isGuest || sessionStatus !== 'ready') {
      seenVolunteerRequestIdsRef.current.clear()
      hasInitializedVolunteerFeedRef.current = false
      setActiveNotifications((currentNotifications) =>
        currentNotifications.length === 0 ? currentNotifications : [],
      )
      return
    }

    if (shouldUseMockLiveRequests) {
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
  }, [isGuest, sessionStatus, shouldUseMockLiveRequests, volunteerFeedRequests])

  useEffect(() => {
    if (!successToastMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessToastMessage(null)
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [successToastMessage])

  const displayedMyRequestsWithOfferSummary = useMemo(() => {
    void offersRevision

    return displayedMyRequests.map((request) => ({
      ...request,
      supportingText: getReceivedOffersSummary(request),
    }))
  }, [displayedMyRequests, offersRevision])

  const selectedMyRequest = useMemo(
    () =>
      displayedMyRequestsWithOfferSummary.find((request) => request.id === selectedMyRequestId) ??
      null,
    [displayedMyRequestsWithOfferSummary, selectedMyRequestId],
  )

  const selectedMyRequestOffers = useMemo(() => {
    void offersRevision

    return selectedMyRequest ? listMockHelpOffers(selectedMyRequest) : []
  }, [offersRevision, selectedMyRequest])

  const handleVolunteerRequestOpen = useCallback(
    (request: LiveRequestCardData) => {
      const identity = resolveChatViewerIdentity(authUser)
      const conversation = ensureMockConversation(request, identity)
      navigate(`/chat/${conversation.id}`)
    },
    [authUser, navigate],
  )

  const handleMyRequestOpen = useCallback((request: LiveRequestCardData) => {
    setOfferDecisionState(null)
    setSelectedMyRequestId(request.id)
  }, [])

  const handleOfferReject = useCallback((offer: HelpOfferData) => {
    updateMockHelpOfferStatus(offer.requestId, offer.id, 'rejected')
    setOfferDecisionState((currentState) =>
      currentState?.offer.id === offer.id ? null : currentState,
    )
    setOffersRevision((currentValue) => currentValue + 1)
  }, [])

  const handleOfferAccept = useCallback(
    (offer: HelpOfferData) => {
      if (!selectedMyRequest) {
        return
      }

      setOfferDecisionState({
        offer,
        request: selectedMyRequest,
      })
      setSelectedMyRequestId(null)
    },
    [selectedMyRequest],
  )

  const handleOfferDecisionAccept = useCallback(
    () => {
      if (!offerDecisionState) {
        return
      }

      updateMockHelpOfferStatus(offerDecisionState.request.id, offerDecisionState.offer.id, 'accepted')
      setOfferDecisionState(null)
      setOffersRevision((currentValue) => currentValue + 1)

      const conversation = ensureMockConversationForAcceptedOffer(
        offerDecisionState.request,
        resolveChatViewerIdentity(authUser),
        {
          volunteerKey: offerDecisionState.offer.volunteerKey,
          volunteerName: offerDecisionState.offer.volunteerName,
        },
      )

      navigate(`/chat/${conversation.id}`)
    },
    [authUser, navigate, offerDecisionState],
  )

  const handleOfferDecisionReject = useCallback(() => {
    if (!offerDecisionState) {
      return
    }

    updateMockHelpOfferStatus(offerDecisionState.request.id, offerDecisionState.offer.id, 'rejected')
    setOffersRevision((currentValue) => currentValue + 1)
    setSelectedMyRequestId(offerDecisionState.request.id)
    setOfferDecisionState(null)
  }, [offerDecisionState])

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

  const canCancelRequest = useCallback(
    (request: LiveRequestCardData) =>
      Boolean(request.requesterKey && request.requesterKey === viewerIdentity.key),
    [viewerIdentity.key],
  )

  const handleCancelRequestStart = useCallback((request: LiveRequestCardData) => {
    setCancelErrorMessage(null)
    setRequestPendingCancellation(request)
  }, [])

  const handleCancelRequestConfirm = useCallback(async () => {
    if (!requestPendingCancellation) {
      return
    }

    setIsCancellingRequest(true)

    try {
      if (shouldUseMockLiveRequests) {
        cancelMockLiveRequest(requestPendingCancellation.id)
      } else {
        if (isGuest && !guestSessionId) {
          setCancelErrorMessage('Nu am putut inițializa sesiunea de vizitator. Încearcă din nou.')
          return
        }

        const response =
          isGuest && guestSessionId
            ? await backend.tasks.deleteGuest(requestPendingCancellation.id, guestSessionId)
            : await backend.tasks.delete(requestPendingCancellation.id)

        if (!response.success) {
          setCancelErrorMessage(response.message || 'Nu am putut anula cererea selectată.')
          return
        }
      }

      cancelMockRequestConversations(requestPendingCancellation.id, viewerIdentity)
      setCancelledRequestIds((currentIds) =>
        currentIds.includes(requestPendingCancellation.id)
          ? currentIds
          : [...currentIds, requestPendingCancellation.id],
      )
      setActiveNotifications((currentNotifications) =>
        currentNotifications.filter(
          (notification) =>
            notification.request.id !== requestPendingCancellation.id &&
            notification.id !== getVolunteerNotificationId(requestPendingCancellation.id),
        ),
      )
      setCancelErrorMessage(null)
      setOfferDecisionState((currentState) =>
        currentState?.request.id === requestPendingCancellation.id ? null : currentState,
      )
      setSelectedMyRequestId((currentRequestId) =>
        currentRequestId === requestPendingCancellation.id ? null : currentRequestId,
      )
      setRequestPendingCancellation(null)
      setSuccessToastMessage('Cererea ta a fost anulată.')

      if (!shouldUseMockLiveRequests) {
        void refetchLiveRequests()
      }
    } finally {
      setIsCancellingRequest(false)
    }
  }, [
    guestSessionId,
    isGuest,
    refetchLiveRequests,
    requestPendingCancellation,
    shouldUseMockLiveRequests,
    viewerIdentity,
  ])

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
                Conectăm oamenii cu voluntari locali în momente de criză, într-un spațiu clar,
                calm și ușor de folosit.
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

          <LiveRequestsSection
            isLoading={isLoadingLiveRequests}
            myRequests={displayedMyRequestsWithOfferSummary}
            onMyRequestOpen={handleMyRequestOpen}
            onVolunteerRequestOpen={handleVolunteerRequestOpen}
            renderMyRequestActions={(request) =>
              canCancelRequest(request) ? (
                <Button
                  className="w-full text-brand-red hover:text-brand-red sm:w-auto"
                  onClick={() => handleCancelRequestStart(request)}
                  variant="ghost"
                >
                  Anulează Cererea
                </Button>
              ) : null
            }
            volunteerRequests={displayedVolunteerRequests}
          />
        </div>
      </section>

      <HelpOffersInboxDialog
        offers={selectedMyRequestOffers}
        onAccept={handleOfferAccept}
        onOpenChange={(open) => {
          if (!open) {
            setOfferDecisionState(null)
            setSelectedMyRequestId(null)
          }
        }}
        onReject={handleOfferReject}
        open={selectedMyRequest !== null}
        request={selectedMyRequest}
      />

      <AcceptVolunteerModal
        averageRating={offerDecisionState?.offer.averageRating ?? 0}
        isOpen={offerDecisionState !== null}
        onClose={() => {
          if (!offerDecisionState) {
            return
          }

          setSelectedMyRequestId(offerDecisionState.request.id)
          setOfferDecisionState(null)
        }}
        onAccept={handleOfferDecisionAccept}
        onDecline={handleOfferDecisionReject}
        volunteerName={offerDecisionState?.offer.volunteerName ?? ''}
      />

      <CancelRequestDialog
        errorMessage={cancelErrorMessage}
        isSubmitting={isCancellingRequest}
        onConfirm={() => void handleCancelRequestConfirm()}
        onOpenChange={(open) => {
          if (!open && !isCancellingRequest) {
            setCancelErrorMessage(null)
            setRequestPendingCancellation(null)
          }
        }}
        open={requestPendingCancellation !== null}
      />

      {successToastMessage ? (
        <div className="pointer-events-none fixed inset-x-4 top-20 z-[65] flex justify-center sm:top-24">
          <div className="rounded-full border border-brand-green/25 bg-white px-4 py-2 text-sm font-medium text-brand-black shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            {successToastMessage}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default HomePage
