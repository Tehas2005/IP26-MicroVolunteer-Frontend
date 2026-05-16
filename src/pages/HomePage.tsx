import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import AcceptVolunteerModal from '@/components/modals/AcceptVolunteerModal'
import AnimatedCharacters from '@/components/shared/AnimatedCharacters'
import HelpOffersInboxDialog from '@/components/shared/HelpOffersInboxDialog'
import LiveRequestsSection from '@/components/shared/LiveRequestsSection'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import VolunteerNotificationStack from '@/components/shared/VolunteerNotificationStack'
import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import {
  extractTasksList,
  isTaskOwnedByCurrentUser,
  mapTaskToLiveRequestCard,
  readCreatedTaskIds,
} from '@/lib/liveRequests'
import {
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
import { getMockLiveRequestSections } from '@/lib/mockLiveRequests'
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
  const [activeNotifications, setActiveNotifications] = useState<VolunteerNotificationItem[]>([])
  const [offerDecisionState, setOfferDecisionState] = useState<OfferDecisionState | null>(null)
  const [selectedMyRequestId, setSelectedMyRequestId] = useState<string | null>(null)
  const [offersRevision, setOffersRevision] = useState(0)
  const seenVolunteerRequestIdsRef = useRef<Set<string>>(new Set())
  const hasInitializedVolunteerFeedRef = useRef(false)

  const { data: liveTasksData, isLoading: isLoadingLiveRequests } = useQuery({
    queryKey: ['live-requests', authUser?.id],
    enabled: sessionStatus === 'ready' && !isGuest,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const response = await backend.tasks.list({
        page: 1,
        pageSize: 50,
        order: 'DESC',
      })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut încărca cererile live.')
      }

      return extractTasksList(response.data)
    },
  })
  const liveTasks = liveTasksData ?? EMPTY_TASKS

  const { myRequests, volunteerFeedRequests } = useMemo(() => {
    if (isGuest || !authUser) {
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
          currentUserName: authUser.name,
          isOwnedByCurrentUser: true,
        }),
      ),
      volunteerFeedRequests: publicTasks.map((task) =>
        mapTaskToLiveRequestCard(task, {
          currentUserName: authUser.name,
          isOwnedByCurrentUser: false,
        }),
      ),
    }
  }, [authUser, isGuest, liveTasks])

  const mockLiveRequests = useMemo(() => getMockLiveRequestSections(authUser), [authUser])
  const shouldUseMockLiveRequests =
    !isLoadingLiveRequests && myRequests.length === 0 && volunteerFeedRequests.length === 0

  const displayedMyRequests = shouldUseMockLiveRequests ? mockLiveRequests.myRequests : myRequests
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
    </div>
  )
}

export default HomePage
