import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

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
  extractOfferRedirectMeta,
  extractTaskOffers,
  getReceivedOffersSummaryFromOffers,
  type HelpOfferData,
} from '@/lib/helpOffers'
import {
  extractTask,
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
  listMockHelpOffers,
  updateMockHelpOfferStatus,
} from '@/lib/mockHelpOffers'
import { cancelMockLiveRequest, getMockLiveRequestSections } from '@/lib/mockLiveRequests'
import {
  buildNotificationsWebSocketUrl,
  createVolunteerNotification,
  getVolunteerNotificationId,
  isBackendNotificationId,
  mapNotificationRecordsToItems,
  mapNotificationSocketFrameToItem,
  type VolunteerNotificationItem,
} from '@/lib/volunteerNotifications'
import type { NotificationListResponseType, TaskResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

const EMPTY_TASKS: TaskResponseType[] = []
const EMPTY_REQUESTS: LiveRequestCardData[] = []
const EMPTY_OFFERS: HelpOfferData[] = []
const FALLBACK_OFFERS_SUMMARY = 'Apasă pentru a vedea ofertele primite.'
const NOTIFICATIONS_WS_BOOT_TIMEOUT_MS = 2500

function mergeNotifications(
  currentNotifications: VolunteerNotificationItem[],
  nextNotifications: VolunteerNotificationItem[],
) {
  if (nextNotifications.length === 0) {
    return currentNotifications
  }

  const notificationsById = new Map<string, VolunteerNotificationItem>()

  currentNotifications.forEach((notification) => {
    const notificationKey =
      notification.request?.id ?? notification.relatedRequestId ?? notification.id
    notificationsById.set(notificationKey, notification)
  })

  nextNotifications.forEach((notification) => {
    const notificationKey =
      notification.request?.id ?? notification.relatedRequestId ?? notification.id
    notificationsById.set(notificationKey, notification)
  })

  return Array.from(notificationsById.values())
    .sort((left, right) => {
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0

      return leftDate - rightDate
    })
    .slice(-4)
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
  const [requestPendingCancellation, setRequestPendingCancellation] =
    useState<LiveRequestCardData | null>(null)
  const [selectedMyRequestId, setSelectedMyRequestId] = useState<string | null>(null)
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null)
  const [offersRevision, setOffersRevision] = useState(0)
  const [offerActionErrorMessage, setOfferActionErrorMessage] = useState<string | null>(null)
  const [notificationTransportStatus, setNotificationTransportStatus] = useState<
    'idle' | 'active' | 'failed'
  >('idle')
  const seenVolunteerRequestIdsRef = useRef<Set<string>>(new Set())
  const hasInitializedVolunteerFeedRef = useRef(false)
  const requestLookupRef = useRef<Map<string, LiveRequestCardData>>(new Map())

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

  const { data: liveTasksData, isLoading: isLoadingLiveRequests, refetch: refetchLiveRequests } =
    useQuery({
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
      const isOwnedByCurrentUser = isTaskOwnedByCurrentUser(
        task,
        authUser.id,
        locallyTrackedTaskIds,
      )

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
  const shouldAttemptBackendNotifications = sessionStatus === 'ready' && !isGuest
  const shouldUseBackendNotifications =
    shouldAttemptBackendNotifications && notificationTransportStatus !== 'failed'
  const shouldUseBackendOffers = sessionStatus === 'ready' && !isGuest && !shouldUseMockLiveRequests
  const cancelledRequestIdsSet = useMemo(() => new Set(cancelledRequestIds), [cancelledRequestIds])

  const displayedMyRequests = (
    shouldUseMockLiveRequests ? mockLiveRequests.myRequests : myRequests
  ).filter((request) => !cancelledRequestIdsSet.has(request.id))
  const displayedVolunteerRequests = shouldUseMockLiveRequests
    ? mockLiveRequests.volunteerRequests
    : volunteerFeedRequests

  const requestLookup = useMemo(() => {
    const nextLookup = new Map<string, LiveRequestCardData>()

    displayedMyRequests.forEach((request) => {
      nextLookup.set(request.id, request)
    })

    displayedVolunteerRequests.forEach((request) => {
      nextLookup.set(request.id, request)
    })

    return nextLookup
  }, [displayedMyRequests, displayedVolunteerRequests])

  useEffect(() => {
    if (!shouldAttemptBackendNotifications) {
      setNotificationTransportStatus('idle')
      return
    }

    setNotificationTransportStatus('idle')
  }, [authUser?.id, shouldAttemptBackendNotifications])

  useEffect(() => {
    requestLookupRef.current = requestLookup
  }, [requestLookup])

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
      const existingRequestIds = new Set(
        currentNotifications
          .map((item) => item.request?.id ?? item.relatedRequestId)
          .filter((requestId): requestId is string => Boolean(requestId)),
      )
      const nextNotifications = unseenRequests
        .map((request) => createVolunteerNotification(request))
        .filter((notification) => {
          const requestId = notification.request?.id ?? notification.relatedRequestId

          if (!requestId) {
            return true
          }

          return !existingRequestIds.has(requestId)
        })

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

  const { data: unreadNotificationsPayload = null, isSuccess: hasLoadedUnreadNotifications } =
    useQuery({
      queryKey: ['unread-volunteer-notifications', authUser?.id],
      enabled: shouldUseBackendNotifications,
      queryFn: async () => {
        const response = await backend.notifications.list({
          page: 1,
          pageSize: 20,
          unreadOnly: 'true',
        })

        if (!response.success) {
          throw new Error(response.message || 'Nu am putut încărca notificările.')
        }

        return response.data as NotificationListResponseType | null
      },
    })

  const unreadNotificationItems = useMemo(
    () => mapNotificationRecordsToItems(unreadNotificationsPayload, requestLookup),
    [requestLookup, unreadNotificationsPayload],
  )

  useEffect(() => {
    if (!shouldUseBackendNotifications || !hasLoadedUnreadNotifications) {
      return
    }

    setActiveNotifications((currentNotifications) =>
      mergeNotifications(currentNotifications, unreadNotificationItems),
    )
  }, [hasLoadedUnreadNotifications, shouldUseBackendNotifications, unreadNotificationItems])

  useEffect(() => {
    if (!shouldAttemptBackendNotifications || notificationTransportStatus !== 'idle') {
      return
    }

    if (typeof window === 'undefined' || typeof window.WebSocket !== 'function') {
      setNotificationTransportStatus('failed')
      return
    }

    let hasOpened = false
    let isDisposed = false
    const socket = new window.WebSocket(buildNotificationsWebSocketUrl())
    const bootTimeout = window.setTimeout(() => {
      if (hasOpened || isDisposed) {
        return
      }

      setNotificationTransportStatus('failed')
      socket.close()
    }, NOTIFICATIONS_WS_BOOT_TIMEOUT_MS)

    socket.onopen = () => {
      hasOpened = true
      window.clearTimeout(bootTimeout)
      setNotificationTransportStatus('active')
    }

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return
      }

      const nextNotification = mapNotificationSocketFrameToItem(
        event.data,
        requestLookupRef.current,
      )

      if (!nextNotification) {
        return
      }

      setActiveNotifications((currentNotifications) =>
        mergeNotifications(currentNotifications, [nextNotification]),
      )
    }

    socket.onerror = () => {
      if (!hasOpened && !isDisposed) {
        window.clearTimeout(bootTimeout)
        setNotificationTransportStatus('failed')
      }
    }

    socket.onclose = () => {
      window.clearTimeout(bootTimeout)

      if (!isDisposed) {
        setNotificationTransportStatus('failed')
      }
    }

    return () => {
      isDisposed = true
      window.clearTimeout(bootTimeout)
      socket.close()
    }
  }, [notificationTransportStatus, shouldAttemptBackendNotifications])

  const { data: offersSummaryEntries = [] } = useQuery({
    queryKey: [
      'task-offer-summaries',
      displayedMyRequests.map((request) => request.id).join('|'),
      offersRevision,
    ],
    enabled: shouldUseBackendOffers && displayedMyRequests.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        displayedMyRequests.map(async (request) => {
          const response = await backend.tasks.listOffers(request.id, {
            page: 1,
            pageSize: 20,
          })

          return [
            request.id,
            response.success ? extractTaskOffers(response.data, request.id) : [],
          ] as const
        }),
      )

      return results
    },
  })

  const offersSummaryMap = useMemo(
    () => new Map<string, HelpOfferData[]>(offersSummaryEntries),
    [offersSummaryEntries],
  )

  const displayedMyRequestsWithOfferSummary = useMemo(() => {
    if (shouldUseMockLiveRequests) {
      void offersRevision

      return displayedMyRequests.map((request) => ({
        ...request,
        supportingText: getReceivedOffersSummaryFromOffers(listMockHelpOffers(request)),
      }))
    }

    return displayedMyRequests.map((request) => ({
      ...request,
      supportingText: offersSummaryMap.has(request.id)
        ? getReceivedOffersSummaryFromOffers(offersSummaryMap.get(request.id) ?? EMPTY_OFFERS)
        : request.supportingText?.trim() || FALLBACK_OFFERS_SUMMARY,
    }))
  }, [displayedMyRequests, offersRevision, offersSummaryMap, shouldUseMockLiveRequests])

  const selectedMyRequest = useMemo(
    () =>
      displayedMyRequestsWithOfferSummary.find((request) => request.id === selectedMyRequestId) ??
      null,
    [displayedMyRequestsWithOfferSummary, selectedMyRequestId],
  )

  useEffect(() => {
    setOfferActionErrorMessage(null)
  }, [selectedMyRequestId])

  const {
    data: selectedBackendOffers = EMPTY_OFFERS,
    error: selectedOffersError,
    isLoading: isLoadingSelectedOffers,
    refetch: refetchSelectedOffers,
  } = useQuery({
    queryKey: ['task-offers', selectedMyRequest?.id, offersRevision],
    enabled: shouldUseBackendOffers && selectedMyRequest !== null,
    queryFn: async () => {
      if (!selectedMyRequest) {
        return EMPTY_OFFERS
      }

      const response = await backend.tasks.listOffers(selectedMyRequest.id, {
        page: 1,
        pageSize: 20,
      })

      if (!response.success) {
        throw new Error(response.message || 'Nu am putut încărca ofertele pentru această cerere.')
      }

      return extractTaskOffers(response.data, selectedMyRequest.id)
    },
  })

  const selectedMyRequestOffers = useMemo(() => {
    if (!selectedMyRequest) {
      return EMPTY_OFFERS
    }

    if (shouldUseMockLiveRequests) {
      void offersRevision

      return listMockHelpOffers(selectedMyRequest)
    }

    return selectedBackendOffers
  }, [offersRevision, selectedBackendOffers, selectedMyRequest, shouldUseMockLiveRequests])

  const selectedOffersErrorMessage =
    offerActionErrorMessage ||
    (selectedOffersError instanceof Error ? selectedOffersError.message : null)

  const handleVolunteerRequestOpen = useCallback(
    (request: LiveRequestCardData) => {
      const identity = resolveChatViewerIdentity(authUser)
      const conversation = ensureMockConversation(request, identity)
      navigate(`/chat/${conversation.id}`)
    },
    [authUser, navigate],
  )

  const handleMyRequestOpen = useCallback((request: LiveRequestCardData) => {
    setOfferActionErrorMessage(null)
    setSelectedMyRequestId(request.id)
  }, [])

  const handleOfferReject = useCallback(
    async (offer: HelpOfferData) => {
      if (!selectedMyRequest) {
        return
      }

      if (shouldUseMockLiveRequests) {
        updateMockHelpOfferStatus(offer.requestId, offer.id, 'rejected')
        setOffersRevision((currentValue) => currentValue + 1)
        return
      }

      const response = await backend.offers.updateStatus(offer.id, { status: 'REJECTED' })

      if (!response.success) {
        setOfferActionErrorMessage(response.message || 'Nu am putut refuza oferta selectată.')
        return
      }

      setOfferActionErrorMessage(null)
      setOffersRevision((currentValue) => currentValue + 1)
      void refetchSelectedOffers()
    },
    [refetchSelectedOffers, selectedMyRequest, shouldUseMockLiveRequests],
  )

  const handleOfferAccept = useCallback(
    async (offer: HelpOfferData) => {
      if (!selectedMyRequest) {
        return
      }

      if (shouldUseMockLiveRequests) {
        updateMockHelpOfferStatus(selectedMyRequest.id, offer.id, 'accepted')
        setOffersRevision((currentValue) => currentValue + 1)

        const conversation = ensureMockConversationForAcceptedOffer(
          selectedMyRequest,
          resolveChatViewerIdentity(authUser),
          {
            volunteerKey: offer.volunteerKey,
            volunteerName: offer.volunteerName,
          },
        )

        navigate(`/chat/${conversation.id}`)
        return
      }

      const response = await backend.offers.updateStatus(offer.id, { status: 'ACCEPTED' })

      if (!response.success) {
        setOfferActionErrorMessage(response.message || 'Nu am putut accepta oferta selectată.')
        return
      }

      setOfferActionErrorMessage(null)
      setOffersRevision((currentValue) => currentValue + 1)

      const redirectMeta = extractOfferRedirectMeta(response.data)

      const conversation = ensureMockConversationForAcceptedOffer(
        selectedMyRequest,
        resolveChatViewerIdentity(authUser),
        {
          volunteerKey: offer.volunteerKey,
          volunteerName: offer.volunteerName,
        },
        {
          preferredConversationId:
            redirectMeta.conversationId ??
            redirectMeta.helpRequestId ??
            redirectMeta.taskAssignmentId,
        },
      )

      navigate(`/chat/${conversation.id}`)
    },
    [authUser, navigate, selectedMyRequest, shouldUseMockLiveRequests],
  )

  const handleNotificationDismiss = useCallback((notificationId: string) => {
    setActiveNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    )
  }, [])

  const handleNotificationOpen = useCallback(
    async (notification: VolunteerNotificationItem) => {
      if (shouldUseBackendNotifications && isBackendNotificationId(notification.id)) {
        const markAsReadResponse = await backend.notifications.markAsRead(notification.id)

        if (!markAsReadResponse.success) {
          return
        }
      }

      if (notification.request) {
        handleNotificationDismiss(notification.id)
        handleVolunteerRequestOpen(notification.request)
        return
      }

      if (!notification.relatedRequestId) {
        return
      }

      const response = await backend.tasks.getById(notification.relatedRequestId)

      if (!response.success) {
        return
      }

      const task = extractTask(response.data)

      if (!task) {
        return
      }

      const request = mapTaskToLiveRequestCard(task, {
        currentUserName: authUser?.name,
        isOwnedByCurrentUser: false,
      })

      handleNotificationDismiss(notification.id)
      handleVolunteerRequestOpen(request)
    },
    [
      authUser?.name,
      handleNotificationDismiss,
      handleVolunteerRequestOpen,
      shouldUseBackendNotifications,
    ],
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
            notification.request?.id !== requestPendingCancellation.id &&
            notification.id !== getVolunteerNotificationId(requestPendingCancellation.id),
        ),
      )
      setCancelErrorMessage(null)
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
        errorMessage={selectedOffersErrorMessage}
        isLoading={isLoadingSelectedOffers}
        offers={selectedMyRequestOffers}
        onAccept={handleOfferAccept}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMyRequestId(null)
          }
        }}
        onReject={handleOfferReject}
        open={selectedMyRequest !== null}
        request={selectedMyRequest}
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
