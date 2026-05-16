import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const deleteTaskMock = vi.fn()
const deleteGuestTaskMock = vi.fn()
const listGuestTasksMock = vi.fn()
const listTasksMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/backend', () => ({
  backend: {
    tasks: {
      delete: (...args: unknown[]) => deleteTaskMock(...args),
      deleteGuest: (...args: unknown[]) => deleteGuestTaskMock(...args),
      list: (...args: unknown[]) => listTasksMock(...args),
      listGuest: (...args: unknown[]) => listGuestTasksMock(...args),
    },
  },
}))

import {
  ensureMockConversationForAcceptedOffer,
  getMockConversationThread,
  resolveChatViewerIdentity,
} from '@/lib/mockChat'
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

describe('HomePage cancel request flow', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    deleteTaskMock.mockReset()
    deleteGuestTaskMock.mockReset()
    listGuestTasksMock.mockReset()
    listTasksMock.mockReset()
    listTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: [],
      },
    })
    listGuestTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: [],
      },
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
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

  it('afiseaza butonul doar pentru cererea proprie din tab-ul Cererile Mele', async () => {
    const user = userEvent.setup()

    renderHomePage()

    expect(await screen.findByRole('button', { name: 'Anulează Cererea' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Feed Voluntar' }))

    expect(screen.queryByRole('button', { name: 'Anulează Cererea' })).not.toBeInTheDocument()
  })

  it('afiseaza butonul de anulare si pentru visitorul care si-a creat cererea', async () => {
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })

    renderHomePage()

    expect(await screen.findByRole('button', { name: 'Anulează Cererea' })).toBeInTheDocument()
  })

  it('anuleaza o cerere mock, o scoate instant din lista si inchide conversatia cu mesaj de sistem', async () => {
    const user = userEvent.setup()
    const requesterIdentity = resolveChatViewerIdentity({
      id: 'user-123',
      name: 'Maria Stoica',
    })
    const volunteerIdentity = {
      key: 'user:offer-volunteer-ilinca',
      displayName: 'Ilinca Pop',
      isGuest: false,
    } as const

    const conversation = ensureMockConversationForAcceptedOffer(
      {
        id: 'mock-own-request-user-123',
        title: 'Am nevoie de ajutor pentru completarea unor formulare',
        requesterKey: requesterIdentity.key,
        requesterLabel: requesterIdentity.displayName,
        requesterKind: 'user',
      },
      requesterIdentity,
      {
        volunteerKey: volunteerIdentity.key,
        volunteerName: volunteerIdentity.displayName,
      },
    )

    renderHomePage()

    await user.click(await screen.findByRole('button', { name: 'Anulează Cererea' }))

    expect(
      await screen.findByText(/Ești sigur că vrei să anulezi această cerere/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Da, anulează' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('button', {
          name: /Am nevoie de ajutor pentru completarea unor formulare/i,
        }),
      ).not.toBeInTheDocument()
    })

    expect(await screen.findByText('Cererea ta a fost anulată.')).toBeInTheDocument()
    expect(deleteTaskMock).not.toHaveBeenCalled()

    const volunteerThread = getMockConversationThread(conversation.id, volunteerIdentity)
    expect(volunteerThread?.conversation.status).toBe('closed')
    expect(
      volunteerThread?.messages.some(
        (message) =>
          message.from === 'system' &&
          message.content.type === 'text' &&
          message.content.text === 'Autorul a anulat această cerere.',
      ),
    ).toBe(true)
  })

  it('trimite DELETE pentru cererea reala si o scoate instant din feed dupa succes', async () => {
    const user = userEvent.setup()

    listTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 42,
              title: 'Cerere reală de backend',
              description: 'Cererea mea reală',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'user-123',
            },
          ],
        },
      },
    })

    deleteTaskMock.mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
      },
    })

    renderHomePage()

    await user.click(await screen.findByRole('button', { name: 'Anulează Cererea' }))
    await user.click(await screen.findByRole('button', { name: 'Da, anulează' }))

    await waitFor(() => {
      expect(deleteTaskMock).toHaveBeenCalledWith('42')
      expect(screen.queryByRole('button', { name: 'Cerere reală de backend' })).not.toBeInTheDocument()
    })

    expect(await screen.findByText('Cererea ta a fost anulată.')).toBeInTheDocument()
  })

  it('foloseste endpoint-ul guest cand visitorul anuleaza o cerere reala', async () => {
    const user = userEvent.setup()

    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })

    listGuestTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 77,
              title: 'Cerere guest reală',
              description: 'Cererea guest venită din backend',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: null,
            },
          ],
        },
      },
    })
    deleteGuestTaskMock.mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
      },
    })

    renderHomePage()

    await user.click(await screen.findByRole('button', { name: 'Anulează Cererea' }))
    await user.click(await screen.findByRole('button', { name: 'Da, anulează' }))

    await waitFor(() => {
      expect(deleteGuestTaskMock).toHaveBeenCalledWith('77', expect.any(String))
      expect(deleteTaskMock).not.toHaveBeenCalled()
      expect(screen.queryByRole('button', { name: 'Cerere guest reală' })).not.toBeInTheDocument()
    })

    expect(await screen.findByText('Cererea ta a fost anulată.')).toBeInTheDocument()
  })
})
