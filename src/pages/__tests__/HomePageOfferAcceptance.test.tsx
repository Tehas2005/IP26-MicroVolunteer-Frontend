import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const listTasksMock = vi.fn()
const getTaskByIdMock = vi.fn()
const listMineOffersMock = vi.fn()
const listTaskOffersMock = vi.fn()
const updateOfferStatusMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/components/shared/AnimatedCharacters', () => ({
  default: () => <div>AnimatedCharacters</div>,
}))

vi.mock('@/components/shared/VolunteerNotificationStack', () => ({
  default: () => null,
}))

vi.mock('@/components/shared/LiveRequestsSection', () => ({
  default: ({
    myRequests,
    onMyRequestOpen,
  }: {
    myRequests: Array<{ id: string; title?: string | null }>
    onMyRequestOpen: (request: { id: string; title?: string | null }) => void
  }) =>
    myRequests.length > 0 ? (
      <button type="button" onClick={() => onMyRequestOpen(myRequests[0])}>
        Deschide cererea mea
      </button>
    ) : (
      <div>Fara cereri</div>
    ),
}))

vi.mock('@/components/shared/HelpOffersInboxDialog', () => ({
  default: ({
    open,
    offers,
    onAccept,
  }: {
    open: boolean
    offers: Array<{ id: string; volunteerName: string }>
    onAccept: (offer: { id: string; volunteerName: string }) => void
  }) =>
    open && offers.length > 0 ? (
      <button type="button" onClick={() => onAccept(offers[0])}>
        Accepta oferta
      </button>
    ) : null,
}))

vi.mock('@/lib/backend', () => ({
  backend: {
    tasks: {
      list: (...args: unknown[]) => listTasksMock(...args),
      getById: (...args: unknown[]) => getTaskByIdMock(...args),
    },
    offers: {
      listMine: (...args: unknown[]) => listMineOffersMock(...args),
      listForTask: (...args: unknown[]) => listTaskOffersMock(...args),
      updateStatus: (...args: unknown[]) => updateOfferStatusMock(...args),
    },
  },
}))

import HomePage from '@/pages/HomePage'
import { useAuthStore } from '@/store/authStore'

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomePage offer acceptance readiness', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    listTasksMock.mockReset()
    getTaskByIdMock.mockReset()
    listMineOffersMock.mockReset()
    listTaskOffersMock.mockReset()
    updateOfferStatusMock.mockReset()

    listTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 42,
              title: 'Cerere integrare',
              description: 'Cererea mea din backend',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'user-123',
            },
          ],
        },
      },
    })
    listMineOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [],
        },
      },
    })
    listTaskOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 101,
              volunteerUserId: 'volunteer-1',
              helpRequestId: 42,
              message: 'Pot ajuta imediat.',
              status: 'PENDING',
              createdAt: '2026-05-17T15:00:00.000Z',
              volunteer: {
                name: 'Voluntar Test',
              },
            },
          ],
        },
      },
    })
    updateOfferStatusMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          id: 101,
          status: 'ACCEPTED',
        },
      },
    })
    getTaskByIdMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          id: 42,
          status: 'OPEN',
        },
      },
    })

    useAuthStore.setState({
      user: {
        id: 'user-123',
        name: 'Maria Stoica',
        email: 'maria@example.com',
      },
      isGuest: false,
      sessionStatus: 'ready',
      accountStatus: 'active',
      volunteerStatus: 'unknown',
      knownVolunteerUserIds: {},
    })
  })

  it('nu redirectioneaza imediat spre chat daca taskul nu este inca pregatit dupa acceptare', async () => {
    renderHomePage()

    fireEvent.click(await screen.findByRole('button', { name: 'Deschide cererea mea' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Accepta oferta' }))

    await waitFor(() => {
      expect(updateOfferStatusMock).toHaveBeenCalledWith('101', { status: 'ACCEPTED' })
      expect(getTaskByIdMock).toHaveBeenCalled()
    }, { timeout: 7000 })

    const pendingChatNotice = await screen.findByText(
      'Oferta a fost acceptata. Conversatia se pregateste inca putin; incearca din nou imediat.',
      undefined,
      { timeout: 7000 },
    )

    expect(navigateMock).not.toHaveBeenCalledWith('/chat/42')
    expect(pendingChatNotice).toBeInTheDocument()
  }, 10000)
})
