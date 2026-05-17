import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import HomePage from '@/pages/HomePage'
import { useAuthStore } from '@/store/authStore'

const navigateMock = vi.fn()

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

vi.mock('@/components/shared/HelpOffersInboxDialog', () => ({
  default: () => null,
}))

vi.mock('@/components/shared/LiveRequestsSection', () => ({
  default: ({
    onVolunteerRequestOpen,
  }: {
    onVolunteerRequestOpen: (request: { id: string; title: string }) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onVolunteerRequestOpen({
          id: 'task-42',
          title: 'Cerere test',
        })
      }
    >
      Deschide cererea din feed
    </button>
  ),
}))

vi.mock('@/lib/backend', () => ({
  backend: {
    tasks: {
      list: vi.fn().mockResolvedValue({
        success: true,
        data: {
          data: [],
        },
      }),
    },
  },
}))

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

describe('HomePage request details navigation', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('trimite utilizatorul din feed către pagina de detalii a cererii', async () => {
    const user = userEvent.setup()

    renderHomePage()

    await user.click(screen.getByRole('button', { name: 'Deschide cererea din feed' }))

    expect(navigateMock).toHaveBeenCalledWith('/cereri/task-42')
  })
})
