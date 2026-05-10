import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import { getGuestSessionId } from './guestSession'

type MockLiveRequestSections = {
  myRequests: LiveRequestCardData[]
  volunteerRequests: LiveRequestCardData[]
}

export function getMockLiveRequestSections(user?: { id: string; name: string } | null): MockLiveRequestSections {
  const guestSessionId = getGuestSessionId()
  const currentUserName = user?.name?.trim() || 'Solicitant'

  return {
    myRequests: [
      {
        id: user?.id ? `mock-own-request-${user.id}` : `mock-own-request-${guestSessionId}`,
        title: 'Am nevoie de ajutor pentru completarea unor formulare',
        category: 'MESSAGES_ONLY',
        urgencyLevel: 'MEDIUM',
        anonymousMode: false,
        name: currentUserName,
        requesterKey: user?.id ? `user:${user.id}` : `guest:${guestSessionId}`,
        requesterKind: user?.id ? 'user' : 'guest',
        requesterLabel: currentUserName,
      },
    ],
    volunteerRequests: [
      {
        id: 'mock-volunteer-request-user',
        title: 'Ridicare medicamente de la farmacie',
        category: 'FACETOFACE',
        urgencyLevel: 'HIGH',
        anonymousMode: false,
        name: 'Ana Popescu',
        requesterKey: 'user:mock-requester-ana',
        requesterKind: 'user',
        requesterLabel: 'Ana Popescu',
      },
      {
        id: 'mock-volunteer-request-guest',
        title: 'Am nevoie de traducere rapidă prin mesaje',
        category: 'MESSAGES_ONLY',
        urgencyLevel: 'CRITICAL',
        anonymousMode: true,
        username: 'utilizator_anonim',
        requesterKey: `guest:${guestSessionId}`,
        requesterKind: 'guest',
        requesterLabel: 'utilizator_anonim',
      },
    ],
  }
}
