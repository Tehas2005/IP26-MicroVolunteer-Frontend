import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import { backend } from '@/lib/backend'
import RequestDetailsPage from '@/pages/RequestDetailsPage'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

const taskResponse = {
  success: true,
  data: {
    data: {
      id: 'task-1',
      title: 'Ridicare pastile',
      category: 'FACE_TO_FACE',
      urgency: 'CRITICAL',
      description: 'Am nevoie de ajutor rapid.',
      status: 'OPEN',
    },
  },
  message: '',
  status: 200,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
}

function resetStores() {
  useAuthStore.setState({
    user: null,
    isGuest: true,
    sessionStatus: 'ready',
    volunteerStatus: 'unknown',
    knownVolunteerUserIds: {},
  })

  useVolunteerProfileStore.setState({
    profilesByUserId: {},
  })
}

function renderRequestDetailsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      {
        path: '/cereri/:taskId',
        element: <RequestDetailsPage />,
      },
    ],
    { initialEntries: ['/cereri/task-1'] },
  )

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('RequestDetailsPage volunteer access gating', () => {
  beforeEach(() => {
    resetStores()
    vi.spyOn(backend.tasks, 'getById').mockResolvedValue(taskResponse as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
    cleanup()
  })

  it('permite unui voluntar recunoscut din sesiune sa trimita oferta chiar fara profil local hidratat', async () => {
    const user = userEvent.setup()

    useAuthStore.setState({
      user: {
        id: 'user-2',
        name: 'Maria Ionescu',
        email: 'maria@example.com',
        role: 'volunteer',
      },
      isGuest: false,
      sessionStatus: 'ready',
      volunteerStatus: 'volunteer',
      knownVolunteerUserIds: {
        'user-2': true,
      },
    })

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: /Vreau/ }))

    expect(await screen.findByLabelText('Mesaj de introducere')).toBeInTheDocument()
    expect(screen.queryByText('Acces restricÈ›ionat')).not.toBeInTheDocument()
  })
})
