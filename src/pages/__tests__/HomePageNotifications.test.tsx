import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const listTasksMock = vi.fn()
const markNotificationAsReadMock = vi.fn()
const listNotificationsMock = vi.fn()
const getTaskByIdMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/backend', () => ({
  backend: {
    notifications: {
      list: (...args: unknown[]) => listNotificationsMock(...args),
      markAsRead: (...args: unknown[]) => markNotificationAsReadMock(...args),
    },
    tasks: {
      getById: (...args: unknown[]) => getTaskByIdMock(...args),
      list: (...args: unknown[]) => listTasksMock(...args),
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

describe('HomePage volunteer notifications integration', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    listTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 88,
              title: 'Am nevoie de ajutor pentru completarea unor formulare',
              description:
                'Solicitantul are nevoie de ajutor rapid pentru a ajunge la farmacie.',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'another-user',
              city: 'Cluj-Napoca',
              skillsNeeded: ['transport'],
            },
          ],
        },
      },
    })
    listNotificationsMock.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 701,
            type: 'NEW_REQUEST',
            text: 'Ai primit o alertă nouă pentru o cerere compatibilă.',
            relatedRequestId: 88,
            relatedAssignmentId: null,
            createdAt: '2026-05-16T10:00:00.000Z',
            readAt: null,
          },
        ],
        meta: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
          unreadCount: 1,
        },
      },
    })
    markNotificationAsReadMock.mockResolvedValue({
      success: true,
      data: null,
    })
    getTaskByIdMock.mockReset()
    getTaskByIdMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          id: 88,
          title: 'Am nevoie de ajutor pentru completarea unor formulare',
          description: 'Solicitantul are nevoie de ajutor rapid pentru a ajunge la farmacie.',
          category: 'MESSAGES_ONLY',
          urgency: 'HIGH',
          status: 'OPEN',
          requestedByUserId: 'another-user',
          city: 'Cluj-Napoca',
          skillsNeeded: ['transport'],
        },
      },
    })

    class MockWebSocket {
      public onmessage: ((event: MessageEvent) => void) | null = null

      close() {}
    }

    Object.defineProperty(window, 'WebSocket', {
      writable: true,
      value: MockWebSocket,
    })

    useAuthStore.setState({
      user: {
        id: 'user-123',
        name: 'Maria Stoica',
        email: 'maria@example.com',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })
  })

  it('afișează notificările necitite venite din backend pentru cererile compatibile', async () => {
    renderHomePage()

    expect(await screen.findByText('Cerere nouă pentru voluntari')).toBeInTheDocument()
    expect(
      screen.getByText('Ai primit o alertă nouă pentru o cerere compatibilă.'),
    ).toBeInTheDocument()
  })

  it('păstrează sursa reală de notificări activă chiar dacă feed-ul live este gol', async () => {
    listTasksMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          data: [],
        },
      },
    })

    renderHomePage()

    expect(await screen.findByText('Cerere nouă pentru voluntari')).toBeInTheDocument()

    await waitFor(() => {
      expect(listNotificationsMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        unreadOnly: 'true',
      })
    })
  })

  it('marchează notificarea ca citită și deschide detaliile cererii', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await user.click(await screen.findByRole('button', { name: 'Vezi detalii' }))

    await waitFor(() => {
      expect(markNotificationAsReadMock).toHaveBeenCalledWith('701')
      expect(navigateMock).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\//))
    })
  })

  it('nu elimină notificarea dacă mark-as-read eșuează', async () => {
    const user = userEvent.setup()

    markNotificationAsReadMock.mockResolvedValueOnce({
      success: false,
      data: null,
      message: 'Nu am putut marca notificarea.',
    })

    renderHomePage()

    await user.click(await screen.findByRole('button', { name: 'Vezi detalii' }))

    expect(await screen.findByText('Cerere nouă pentru voluntari')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
