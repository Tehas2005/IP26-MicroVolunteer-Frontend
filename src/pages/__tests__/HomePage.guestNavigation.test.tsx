import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import HomePage from '@/pages/HomePage'
import { useAuthStore } from '@/store/authStore'

vi.mock('@/components/shared/AnimatedCharacters', () => ({
  default: () => <div>AnimatedCharacters</div>,
}))

vi.mock('@/components/shared/LiveRequestsSection', () => ({
  default: () => <div>LiveRequestsSection</div>,
}))

vi.mock('@/components/shared/VolunteerNotificationStack', () => ({
  default: () => null,
}))

describe('HomePage guest navigation', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })
  })

  afterEach(() => {
    localStorage.clear()
    cleanup()
  })

  it('permite tranzitia catre formularul cere-ajutor pentru guest', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const router = createMemoryRouter(
      [
        { path: '/', element: <HomePage /> },
        { path: '/cere-ajutor', element: <div>AskForHelpRoute</div> },
      ],
      { initialEntries: ['/'] },
    )

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Cere Ajutor Acum' }))

    expect(await screen.findByText('AskForHelpRoute')).toBeInTheDocument()
  })
})
