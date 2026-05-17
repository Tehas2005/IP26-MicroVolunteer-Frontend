import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const listTasksMock = vi.fn()
const listNotificationsMock = vi.fn()
const markNotificationAsReadMock = vi.fn()

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

describe('HomePage volunteer notifications', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    listTasksMock.mockReset()
    listNotificationsMock.mockReset()
    markNotificationAsReadMock.mockReset()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    class MockWebSocket {
      public onopen: (() => void) | null = null

      constructor() {
        window.setTimeout(() => this.onopen?.(), 0)
      }

      close() {}
    }

    Object.defineProperty(window, 'WebSocket', {
      writable: true,
      value: MockWebSocket,
    })

    listNotificationsMock.mockResolvedValue({
      success: true,
      data: {
        data: [],
        meta: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
          unreadCount: 0,
        },
      },
    })
    markNotificationAsReadMock.mockResolvedValue({
      success: true,
      data: null,
    })

    useAuthStore.setState({
      user: {
        id: 'volunteer-user-1',
        name: 'Voluntar Test',
        email: 'voluntar@example.com',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })
  })

  it(
    'afiseaza toast pentru o cerere noua din volunteer feed dupa refetch si deschide detaliile',
    async () => {
      const user = userEvent.setup()

      listTasksMock
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              data: [
                {
                  id: 501,
                  title: 'Cerere existenta',
                  description: 'Task deja vazut in feed',
                  category: 'MESSAGES_ONLY',
                  urgency: 'MEDIUM',
                  status: 'OPEN',
                  requestedByUserId: 'requester-1',
                  anonymousMode: false,
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              data: [
                {
                  id: 777,
                  title: 'Cerere noua pentru toast',
                  description: 'A aparut acum si trebuie semnalata voluntarului.',
                  category: 'MESSAGES_ONLY',
                  urgency: 'HIGH',
                  status: 'OPEN',
                  requestedByUserId: 'requester-2',
                  anonymousMode: false,
                },
                {
                  id: 501,
                  title: 'Cerere existenta',
                  description: 'Task deja vazut in feed',
                  category: 'MESSAGES_ONLY',
                  urgency: 'MEDIUM',
                  status: 'OPEN',
                  requestedByUserId: 'requester-1',
                  anonymousMode: false,
                },
              ],
            },
          },
        })

      renderHomePage()

      await screen.findByRole('tab', { name: 'Feed Voluntar' })

      await new Promise((resolve) => {
        window.setTimeout(resolve, 16050)
      })

      await waitFor(() => {
        expect(screen.getByTestId('volunteer-toast-777')).toBeInTheDocument()
      })

      expect(screen.getByText('Noua cerere urgenta!')).toBeInTheDocument()
      expect(
        screen.getByText('A aparut acum si trebuie semnalata voluntarului.'),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Vezi detalii' }))

      expect(markNotificationAsReadMock).not.toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\//))
    },
    20000,
  )
})
