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
        description: 'Am nevoie de cineva care sa ma ghideze pas cu pas prin cateva documente urgente.',
        category: 'MESSAGES_ONLY',
        urgencyLevel: 'MEDIUM',
        anonymousMode: false,
        name: currentUserName,
        city: 'Bucuresti',
        skillsNeeded: ['organizare', 'documente'],
        requesterKey: user?.id ? `user:${user.id}` : `guest:${guestSessionId}`,
        requesterKind: user?.id ? 'user' : 'guest',
        requesterLabel: currentUserName,
      },
    ],
    volunteerRequests: [
      {
        id: 'mock-volunteer-request-user',
        title: 'Ridicare medicamente de la farmacie',
        description: 'O persoana in varsta are nevoie de ajutor rapid pentru ridicarea tratamentului prescris.',
        category: 'FACETOFACE',
        urgencyLevel: 'HIGH',
        anonymousMode: false,
        name: 'Ana Popescu',
        city: 'Cluj-Napoca',
        skillsNeeded: ['transport'],
        requesterKey: 'user:mock-requester-ana',
        requesterKind: 'user',
        requesterLabel: 'Ana Popescu',
      },
      {
        id: 'mock-volunteer-request-guest',
        title: 'Am nevoie de traducere rapidă prin mesaje',
        description: 'Solicitantul are nevoie de ajutor pentru a intelege un mesaj medical primit recent.',
        category: 'MESSAGES_ONLY',
        urgencyLevel: 'CRITICAL',
        anonymousMode: true,
        username: 'utilizator_anonim',
        city: 'Iasi',
        skillsNeeded: ['traducere', 'suport emotional'],
        requesterKey: `guest:${guestSessionId}`,
        requesterKind: 'guest',
        requesterLabel: 'utilizator_anonim',
      },
    ],
  }
}
