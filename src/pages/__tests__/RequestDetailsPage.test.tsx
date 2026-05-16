import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import { backend } from '@/lib/backend'
import RequestDetailsPage from '@/pages/RequestDetailsPage'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

const taskResponse = {
  success: true,
  data: {
    data: {
      id: 'task-1',
      title: 'Ridicare pastile',
      category: 'FACE_TO_FACE',
      urgency: 'CRITICAL',
      description:
        'MERGEȚI REPEDE\n\nLimba necesara: Romana\n\nSiguranta: Nu este niciun risc, calm.\n\nLocatie declarata: Iasi\n\nSkills needed: Ridicare medicamente, Traducere',
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

const successOfferResponse = {
  success: true,
  data: {
    id: 'offer-1',
    helpRequestId: 'task-1',
    message: 'Pot ajunge imediat.',
    status: 'PENDING',
  },
  message: '',
  status: 201,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
}

const forbiddenVolunteerResponse = {
  success: false,
  data: null,
  message: 'Only volunteers can create offers',
  status: 403,
  isClientError: true,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: true,
}

function resetStores() {
  useAuthStore.setState({
    user: null,
    isGuest: true,
    sessionStatus: 'ready',
  })
  useVolunteerProfileStore.setState({
    profilesByUserId: {},
  })
}

function setAuthenticatedSession() {
  useAuthStore.setState({
    user: {
      id: 'user-2',
      name: 'Maria Ionescu',
      email: 'maria@example.com',
    },
    isGuest: false,
    sessionStatus: 'ready',
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

describe('RequestDetailsPage', () => {
  beforeEach(() => {
    resetStores()
    vi.spyOn(backend.tasks, 'getById').mockResolvedValue(taskResponse as never)
    vi.spyOn(backend.tasks, 'createOffer').mockResolvedValue(successOfferResponse)
    vi.spyOn(backend.offers, 'getMine').mockResolvedValue({
      success: false,
      data: null,
      message: 'Only volunteers can create offers',
      status: 403,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
    cleanup()
  })

  it('afișează detaliile cererii în română și extrage corect informațiile compuse', async () => {
    renderRequestDetailsPage()

    expect(await screen.findByRole('heading', { name: 'Ridicare pastile' })).toBeInTheDocument()
    expect(screen.getByText('Față în față')).toBeInTheDocument()
    expect(screen.getAllByText('MERGEȚI REPEDE')).not.toHaveLength(0)
    expect(screen.getByText('Locație: Iasi')).toBeInTheDocument()
    expect(screen.getByText('Ridicare medicamente')).toBeInTheDocument()
    expect(screen.getByText('Traducere')).toBeInTheDocument()
    expect(screen.getByText('Abilități necesare')).toBeInTheDocument()
  })

  it('permite voluntarului validat de backend să deschidă și să trimită oferta', async () => {
    const user = userEvent.setup()
    vi.mocked(backend.offers.getMine).mockResolvedValueOnce({
      success: true,
      data: { data: [], meta: { page: 1, pageSize: 1, total: 0, totalPages: 0 } },
      message: '',
      status: 200,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    setAuthenticatedSession()
    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Vreau să ajut' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))
    await user.type(
      screen.getByLabelText('Mesaj de introducere'),
      'Pot ajunge imediat și pot interveni rapid.',
    )
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    await waitFor(() => {
      expect(backend.tasks.createOffer).toHaveBeenCalledWith('task-1', {
        message: 'Pot ajunge imediat și pot interveni rapid.',
      })
    })
    expect(
      await screen.findByText('Oferta ta a fost trimisă. Așteaptă răspunsul utilizatorului!'),
    ).toBeInTheDocument()
  })

  it('afișează acces restricționat pentru un user care nu este voluntar', async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Vreau să ajut' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))

    expect(await screen.findByText('Acces restricționat')).toBeInTheDocument()
    expect(
      screen.getByText('Trebuie să fii logat și să ai cont de voluntar pentru a accepta cereri.'),
    ).toBeInTheDocument()
  })

  it('traduce răspunsul backend când userul nu este voluntar', async () => {
    const user = userEvent.setup()
    vi.mocked(backend.tasks.createOffer).mockResolvedValueOnce(forbiddenVolunteerResponse)

    setAuthenticatedSession()
    useVolunteerProfileStore.setState({
      profilesByUserId: {
        'user-2': {
          userId: 'user-2',
          location: 'Iași',
          locationCoordinates: { x: 27.6014, y: 47.1585 },
          skills: ['Traducere'],
          hiddenIdentity: false,
          createdAt: '2026-05-16T10:00:00.000Z',
          updatedAt: '2026-05-16T10:00:00.000Z',
        },
      },
    })

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))
    await user.type(screen.getByLabelText('Mesaj de introducere'), 'Pot ajuta.')
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    expect(await screen.findByText('Doar voluntarii pot trimite oferte pentru cereri.')).toBeInTheDocument()
  })
})
