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

const assignedTaskResponse = {
  ...taskResponse,
  data: {
    data: {
      ...taskResponse.data.data,
      status: 'ASSIGNED',
      helperUserId: 'volunteer-1',
    },
  },
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
    expect(screen.getAllByText('Ridicare medicamente')).not.toHaveLength(0)
    expect(screen.getAllByText('Traducere')).not.toHaveLength(0)
    expect(screen.getByText('Abilități necesare')).toBeInTheDocument()
  })

  it('permite voluntarului validat de backend să intre în pasul următor al fluxului', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Vreau să ajut' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Din această pagină se deschide fluxul de trimitere a ofertei de ajutor pentru cererea selectată\./,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Formularul complet pentru trimiterea ofertei de ajutor continuă în taskul dedicat acestui pas\./,
      ),
    )
    expect(screen.getByRole('button', { name: 'Continuă' })).toBeInTheDocument()
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

  it('permite și utilizatorului cu profil local de voluntar să intre în pasul următor', async () => {
    const user = userEvent.setup()
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

    expect(await screen.findByRole('heading', { name: 'Vreau să ajut' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Formularul complet pentru trimiterea ofertei de ajutor continuă în taskul dedicat acestui pas\./,
      ),
    ).toBeInTheDocument()
  })

  it('dezactivează preluarea când cererea este deja atribuită altui voluntar', async () => {
    vi.mocked(backend.tasks.getById).mockResolvedValueOnce(assignedTaskResponse as never)
    setAuthenticatedSession()

    renderRequestDetailsPage()

    expect(await screen.findByRole('heading', { name: 'Ridicare pastile' })).toBeInTheDocument()
    expect(
      screen.getByText('Această cerere de ajutor a fost deja preluată de alt voluntar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerere deja preluată' })).toBeDisabled()
  })
})
