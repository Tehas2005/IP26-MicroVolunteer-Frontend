import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
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
      list: (...args: unknown[]) => listTasksMock(...args),
    },
  },
}))

import { listMockConversations, resolveChatViewerIdentity } from '@/lib/mockChat'
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

describe('HomePage help offers flow', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
    listTasksMock.mockResolvedValue({
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

  it('afiseaza ofertele primite cu mesaj, timp si rating', async () => {
    renderHomePage()

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Am nevoie de ajutor pentru completarea unor formulare/i,
      }),
    )

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

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Am nevoie de ajutor pentru completarea unor formulare/i,
      }),
    )

    const rejectButtons = await screen.findAllByRole('button', { name: 'Refuză' })
    await user.click(rejectButtons[0])

    expect(await screen.findByRole('button', { name: 'Refuzată' })).toBeDisabled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('accepta oferta, inactiveaza restul si pregateste redirectul catre chat', async () => {
    const user = userEvent.setup()

    renderHomePage()

    fireEvent.click(
      await screen.findByRole('button', {
        name: /Am nevoie de ajutor pentru completarea unor formulare/i,
      }),
    )

    const acceptButtons = await screen.findAllByRole('button', { name: 'Acceptă' })
    await user.click(acceptButtons[1])

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(expect.stringMatching(/^\/chat\//))
    })

    expect(await screen.findByRole('button', { name: 'Acceptată' })).toBeDisabled()

    const remainingAcceptButtons = screen.getAllByRole('button', { name: 'Acceptă' })
    remainingAcceptButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })

    expect(
      screen.getAllByText('O altă ofertă a fost deja acceptată pentru această cerere.'),
    ).toHaveLength(2)

    const viewerIdentity = resolveChatViewerIdentity({
      id: 'user-123',
      name: 'Maria Stoica',
    })

    const conversations = listMockConversations(viewerIdentity)
    expect(conversations).toHaveLength(1)
    expect(conversations[0]?.username).toBe('Radu Pavel')
  })
})
