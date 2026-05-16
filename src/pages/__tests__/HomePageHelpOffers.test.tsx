import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const listTasksMock = vi.fn()
const listOffersMock = vi.fn()
const updateOfferStatusMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/backend', () => ({
  backend: {
    offers: {
      updateStatus: (...args: unknown[]) => updateOfferStatusMock(...args),
    },
    tasks: {
      list: (...args: unknown[]) => listTasksMock(...args),
      listOffers: (...args: unknown[]) => listOffersMock(...args),
    },
  },
}))

import { listMockConversations, resolveChatViewerIdentity } from '@/lib/mockChat'
import HomePage from '@/pages/HomePage'
import { useAuthStore } from '@/store/authStore'

const OPEN_OFFERS_BUTTON_NAME = /Am nevoie de ajutor pentru completarea unor formulare/i

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

async function openFirstMockRequestOffers() {
  fireEvent.click(
    await screen.findByRole('button', {
      name: OPEN_OFFERS_BUTTON_NAME,
    }),
  )
}

describe('HomePage help offers flow', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    listOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [],
        },
      },
    })
    listTasksMock.mockResolvedValue({
      success: true,
      data: {
        data: [],
      },
    })
    updateOfferStatusMock.mockResolvedValue({
      success: true,
      data: {
        id: 'offer-accepted',
        status: 'ACCEPTED',
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

  it('afiseaza ofertele primite cu mesaj, timp si rating', async () => {
    renderHomePage()

    await openFirstMockRequestOffers()

    expect(await screen.findByText('Oferte primite')).toBeInTheDocument()
    expect(screen.getByText('Ilinca Pop')).toBeInTheDocument()
    expect(screen.getByText('Radu Pavel')).toBeInTheDocument()
    expect(screen.getByText('Mara Ionescu')).toBeInTheDocument()
    expect(screen.getByText('acum 5 minute')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(
      screen.getByText(/Pot răspunde imediat prin mesaje și te ajut pas cu pas/i),
    ).toBeInTheDocument()
  })

  it('permite refuzarea unei oferte direct din inbox', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await openFirstMockRequestOffers()

    const rejectButtons = await screen.findAllByRole('button', { name: 'Refuză' })
    await user.click(rejectButtons[0])

    expect(await screen.findByRole('button', { name: 'Refuzată' })).toBeDisabled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('deschide modalul real de acceptare cu scorul voluntarului din flow-ul aplicatiei', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await openFirstMockRequestOffers()

    const acceptButtons = await screen.findAllByRole('button', { name: 'Acceptă' })
    await user.click(acceptButtons[1])

    const dialog = await screen.findByTestId('accept-volunteer-dialog')

    expect(within(dialog).getByText('Un voluntar vrea sa te ajute!')).toBeInTheDocument()
    expect(within(dialog).getByText('Radu Pavel')).toBeInTheDocument()
    expect(within(dialog).getByText('4.7')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('accepta oferta din modal, inactiveaza restul si pregateste redirectul catre chat', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await openFirstMockRequestOffers()

    const acceptButtons = await screen.findAllByRole('button', { name: 'Acceptă' })
    await user.click(acceptButtons[1])

    const dialog = await screen.findByTestId('accept-volunteer-dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Accepta ajutorul' }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\//))
    })

    expect(screen.queryByText('Un voluntar vrea sa te ajute!')).not.toBeInTheDocument()
    expect(await screen.findByText('Ajutor acceptat de la Radu Pavel')).toBeInTheDocument()

    const viewerIdentity = resolveChatViewerIdentity({
      id: 'user-123',
      name: 'Maria Stoica',
    })

    const conversations = listMockConversations(viewerIdentity)
    expect(conversations).toHaveLength(1)
    expect(conversations[0]?.username).toBe('Radu Pavel')
  })

  it('refuza oferta din modal si pastreaza utilizatorul in inbox', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await openFirstMockRequestOffers()

    const acceptButtons = await screen.findAllByRole('button', { name: 'Acceptă' })
    await user.click(acceptButtons[0])

    const dialog = await screen.findByTestId('accept-volunteer-dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Refuza' }))

    expect(screen.queryByText('Un voluntar vrea sa te ajute!')).not.toBeInTheDocument()
    expect(await screen.findByText('Oferte primite')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Refuzată' })).toBeDisabled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('pastreaza sumarul corect si statusurile dupa redeschiderea unei cereri cu toate ofertele refuzate', async () => {
    const user = userEvent.setup()

    renderHomePage()
    await openFirstMockRequestOffers()

    await user.click((await screen.findAllByRole('button', { name: 'Refuză' }))[0])
    await user.click((await screen.findAllByRole('button', { name: 'Refuză' }))[0])
    await user.click((await screen.findAllByRole('button', { name: 'Refuză' }))[0])

    await user.click(screen.getByRole('button', { name: 'Închide ofertele' }))

    expect(await screen.findByText('Toate cele 3 oferte au fost refuzate.')).toBeInTheDocument()

    await openFirstMockRequestOffers()

    const rejectedButtons = await screen.findAllByRole('button', { name: 'Refuzată' })
    expect(rejectedButtons).toHaveLength(3)
    rejectedButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })

  it('redeschide aceeasi cerere cu oferta acceptata deja persistata', async () => {
    const user = userEvent.setup()

    renderHomePage()
    await openFirstMockRequestOffers()

    const acceptButtons = await screen.findAllByRole('button', { name: 'Acceptă' })
    await user.click(acceptButtons[0])
    await user.click(
      within(await screen.findByTestId('accept-volunteer-dialog')).getByRole('button', {
        name: 'Accepta ajutorul',
      }),
    )

    expect(
      await screen.findByText('Ajutor acceptat de la Ilinca Pop'),
    ).toBeInTheDocument()

    await openFirstMockRequestOffers()

    expect(await screen.findByRole('button', { name: 'Acceptată' })).toBeDisabled()
    expect(
      screen.getAllByText('O altă ofertă a fost deja acceptată pentru această cerere.'),
    ).toHaveLength(2)
  })

  it('încarcă ofertele reale din backend când există cereri ale utilizatorului', async () => {
    listTasksMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 42,
              title: 'Am nevoie de ajutor pentru completarea unor formulare',
              description: 'Cererea mea reală din backend',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'user-123',
            },
          ],
        },
      },
    })

    listOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 101,
              volunteerId: 'vol-1',
              message: 'Pot ajuta imediat prin mesaje.',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
              volunteer: {
                username: 'ilinca',
                name: 'Ilinca Pop',
                averageRating: 4.9,
              },
            },
            {
              id: 102,
              volunteerId: 'vol-2',
              message: 'Pot prelua cererea în aproximativ 20 de minute.',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
              volunteer: {
                username: 'radu',
                name: 'Radu Pavel',
                averageRating: 4.7,
              },
            },
          ],
        },
      },
    })

    renderHomePage()
    await openFirstMockRequestOffers()

    expect(await screen.findByText('Oferte primite')).toBeInTheDocument()
    expect(await screen.findByText('Ilinca Pop')).toBeInTheDocument()
    expect(await screen.findByText('Radu Pavel')).toBeInTheDocument()
    expect(await screen.findByText('Pot ajuta imediat prin mesaje.')).toBeInTheDocument()
    expect(await screen.findByText('4.9')).toBeInTheDocument()
    expect(listOffersMock).toHaveBeenCalled()
  })

  it('acceptă oferta prin backend și păstrează redirectul spre chat folosind id-ul întors', async () => {
    const user = userEvent.setup()

    listTasksMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 42,
              title: 'Am nevoie de ajutor pentru completarea unor formulare',
              description: 'Cererea mea reală din backend',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'user-123',
            },
          ],
        },
      },
    })

    listOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 101,
              volunteerId: 'vol-1',
              message: 'Pot ajuta imediat prin mesaje.',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
              volunteer: {
                username: 'ilinca',
                name: 'Ilinca Pop',
                averageRating: 4.9,
              },
            },
          ],
        },
      },
    })

    updateOfferStatusMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          id: 101,
          status: 'ACCEPTED',
          conversationId: 'conversation-backend-42',
        },
      },
    })

    renderHomePage()
    await openFirstMockRequestOffers()

    await user.click(await screen.findByRole('button', { name: 'Acceptă' }))
    await user.click(
      within(await screen.findByTestId('accept-volunteer-dialog')).getByRole('button', {
        name: 'Accepta ajutorul',
      }),
    )

    await waitFor(() => {
      expect(updateOfferStatusMock).toHaveBeenCalledWith('101', { status: 'ACCEPTED' })
      expect(navigateMock).toHaveBeenCalledWith('/chat/conversation-backend-42')
    })
  })

  it('folosește helpRequestId ca fallback pentru redirect când backend-ul nu întoarce conversationId', async () => {
    const user = userEvent.setup()

    listTasksMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 42,
              title: 'Am nevoie de ajutor pentru completarea unor formulare',
              description: 'Cererea mea reală din backend',
              category: 'MESSAGES_ONLY',
              urgency: 'HIGH',
              status: 'OPEN',
              requestedByUserId: 'user-123',
            },
          ],
        },
      },
    })

    listOffersMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          data: [
            {
              id: 101,
              volunteerId: 'vol-1',
              message: 'Pot ajuta imediat prin mesaje.',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
              volunteer: {
                username: 'ilinca',
                name: 'Ilinca Pop',
                averageRating: 4.9,
              },
            },
          ],
        },
      },
    })

    updateOfferStatusMock.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          id: 101,
          status: 'ACCEPTED',
          helpRequestId: 'backend-request-42',
        },
      },
    })

    renderHomePage()
    await openFirstMockRequestOffers()

    await user.click(await screen.findByRole('button', { name: 'Acceptă' }))
    await user.click(
      within(await screen.findByTestId('accept-volunteer-dialog')).getByRole('button', {
        name: 'Accepta ajutorul',
      }),
    )

    await waitFor(() => {
      expect(updateOfferStatusMock).toHaveBeenCalledWith('101', { status: 'ACCEPTED' })
      expect(navigateMock).toHaveBeenCalledWith('/chat/backend-request-42')
    })
  })
})
