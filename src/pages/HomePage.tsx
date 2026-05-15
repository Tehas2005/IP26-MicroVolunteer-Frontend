import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import AnimatedCharacters from '@/components/shared/AnimatedCharacters'
import LiveRequestsSection from '@/components/shared/LiveRequestsSection'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import {
  extractTasksList,
  isTaskOwnedByCurrentUser,
  mapTaskToLiveRequestCard,
  readCreatedTaskIds,
} from '@/lib/liveRequests'
import { ensureMockConversation, resolveChatViewerIdentity } from '@/lib/mockChat'
import { getMockLiveRequestSections } from '@/lib/mockLiveRequests'
import { useAuthStore } from '@/store/authStore'

export function HomePage() {
  const navigate = useNavigate()
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const authUser = useAuthStore((state) => state.user)

  const { data: liveTasks = [], isLoading: isLoadingLiveRequests } = useQuery({
    queryKey: ['live-requests', authUser?.id],
    enabled: sessionStatus === 'ready' && !isGuest,
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

  const { myRequests, volunteerFeedRequests } = useMemo(() => {
    if (isGuest || !authUser) {
      return {
        myRequests: [],
        volunteerFeedRequests: [],
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

  const handleVolunteerRequestOpen = useCallback(
    (request: LiveRequestCardData) => {
      const identity = resolveChatViewerIdentity(authUser)
      const conversation = ensureMockConversation(request, identity)
      navigate(`/chat/${conversation.id}`)
    },
    [authUser, navigate],
  )

  return (
    <div className="bg-brand-cream">
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
            myRequests={displayedMyRequests}
            onVolunteerRequestOpen={handleVolunteerRequestOpen}
            volunteerRequests={displayedVolunteerRequests}
          />
        </div>
      </section>
    </div>
  )
}

export default HomePage
