import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import { getGuestSessionId } from './guestSession'

const CANCELED_MOCK_REQUESTS_STORAGE_KEY = 'mvcr-cancelled-mock-request-ids'

type MockLiveRequestSections = {
  myRequests: LiveRequestCardData[]
  volunteerRequests: LiveRequestCardData[]
}

function readCanceledRequestIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(CANCELED_MOCK_REQUESTS_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)

    return Array.isArray(parsed)
      ? parsed.filter((requestId): requestId is string => typeof requestId === 'string')
      : []
  } catch {
    return []
  }
}

function writeCanceledRequestIds(requestIds: string[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CANCELED_MOCK_REQUESTS_STORAGE_KEY, JSON.stringify(requestIds))
}

export function cancelMockLiveRequest(requestId: string) {
  const currentRequestIds = new Set(readCanceledRequestIds())
  currentRequestIds.add(requestId)
  writeCanceledRequestIds(Array.from(currentRequestIds))
}

export function getMockLiveRequestSections(
  user?: { id: string; name: string } | null,
): MockLiveRequestSections {
  const guestSessionId = getGuestSessionId()
  const currentUserName = user?.name?.trim() || 'Solicitant'
  const canceledRequestIds = new Set(readCanceledRequestIds())
  const myRequests: LiveRequestCardData[] = [
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
  ]

  return {
    myRequests: myRequests.filter((request) => !canceledRequestIds.has(request.id)),
    volunteerRequests: [
      {
        id: 'mock-volunteer-request-user',
        title: 'Ridicare medicamente de la farmacie',
        description: 'O persoana in varsta are nevoie de ajutor rapid pentru ridicarea tratamentului prescris.',
        status: 'closed',
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
