import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import { backend } from '@/lib/backend'
import RequestDetailsPage from '@/pages/RequestDetailsPage'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

const { toastSuccessMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

describe('RequestDetailsPage', () => {
  beforeEach(() => {
    resetStores()
    vi.spyOn(backend.tasks, 'getById').mockResolvedValue(taskResponse as never)
    vi.spyOn(backend.offers, 'createForTask').mockResolvedValue({
      success: true,
      data: {
        id: 'offer-1',
        helpRequestId: 'task-1',
        volunteerId: 'volunteer-1',
        message: 'Vă pot ajuta chiar astăzi.',
        status: 'PENDING',
        createdAt: '2026-05-17T10:00:00.000Z',
      },
      message: '',
      status: 201,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    } as never)
    toastSuccessMock.mockReset()
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

  it('afișează playerul audio când descrierea conține un mesaj vocal', async () => {
    vi.mocked(backend.tasks.getById).mockResolvedValueOnce({
      ...taskResponse,
      data: {
        data: {
          ...taskResponse.data.data,
          description:
            'Ajutor urgent.\n\nMesaj vocal: https://cdn.example.com/audio/request.mp3',
        },
      },
    } as never)

    const { container } = renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })

    const audioPlayer = container.querySelector('audio')
    expect(audioPlayer).not.toBeNull()
    expect(audioPlayer as HTMLAudioElement).toHaveAttribute(
      'src',
      'https://cdn.example.com/audio/request.mp3',
    )
    expect(screen.queryByText(/Mesaj vocal:\s*https:\/\/cdn\.example\.com/)).not.toBeInTheDocument()
  })

  it('permite voluntarului cu profil local să deschidă modalul real de ofertă', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Ofertă de ajutor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mesaj de introducere')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trimite oferta de ajutor' })).toBeInTheDocument()
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

  it('afișează acces restricționat pentru un user autentificat fără profil de voluntar', async () => {
    const user = userEvent.setup()
    setAuthenticatedSession()

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))

    expect(await screen.findByText('Acces restricționat')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Trebuie să fii logat și să ai cont de voluntar pentru a accepta cereri.',
      ),
    ).toBeInTheDocument()
  })

  it('validează mesajul obligatoriu înainte de submit', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    expect(await screen.findByText('Mesajul de introducere este obligatoriu.')).toBeInTheDocument()
    expect(backend.offers.createForTask).not.toHaveBeenCalled()
  })

  it('trimite oferta validă și afișează mesajul de succes', async () => {
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
    await user.type(screen.getByLabelText('Mesaj de introducere'), 'Pot ajunge în aproximativ 20 de minute.')
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    await waitFor(() => {
      expect(backend.offers.createForTask).toHaveBeenCalledWith('task-1', {
        message: 'Pot ajunge în aproximativ 20 de minute.',
      })
    })
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Oferta ta a fost trimisă. Așteaptă răspunsul utilizatorului!',
      )
    })
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Ofertă de ajutor' })).not.toBeInTheDocument()
    })
  })

  it('traduce în română erorile backend la submit', async () => {
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
    vi.mocked(backend.offers.createForTask).mockResolvedValueOnce({
      success: false,
      data: null,
      message: 'HelpRequest is not OPEN',
      status: 409,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    } as never)

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))
    await user.type(screen.getByLabelText('Mesaj de introducere'), 'Pot ajuta.')
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    expect(
      await screen.findByText('Această cerere de ajutor a fost deja preluată de alt voluntar.'),
    ).toBeInTheDocument()
  })

  it('afișează un fallback clar și resetează loading-ul dacă submit-ul aruncă excepție', async () => {
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
    vi.mocked(backend.offers.createForTask).mockRejectedValueOnce(new Error('network down') as never)

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))
    await user.type(screen.getByLabelText('Mesaj de introducere'), 'Pot ajuta.')
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    expect(
      await screen.findByText('Nu am putut trimite oferta de ajutor. Încearcă din nou.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trimite oferta de ajutor' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Închide' })).toBeEnabled()
  })

  it('nu permite închiderea modalului cât timp submit-ul este în desfășurare', async () => {
    const user = userEvent.setup()
    const createOfferRequest = deferred<{
      success: boolean
      data: {
        id: string
        helpRequestId: string
        volunteerId: string
        message: string
        status: string
        createdAt: string
      }
      message: string
      status: number
      isClientError: boolean
      isServerError: boolean
      isNotFound: boolean
      isUnauthorized: boolean
      isForbidden: boolean
    }>()

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
    vi.mocked(backend.offers.createForTask).mockImplementationOnce(() => createOfferRequest.promise as never)

    renderRequestDetailsPage()

    await screen.findByRole('heading', { name: 'Ridicare pastile' })
    await user.click(screen.getByRole('button', { name: 'Vreau să ajut' }))
    await user.type(screen.getByLabelText('Mesaj de introducere'), 'Pot ajuta.')
    await user.click(screen.getByRole('button', { name: 'Trimite oferta de ajutor' }))

    expect(screen.getByRole('button', { name: 'Trimitem oferta...' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('heading', { name: 'Ofertă de ajutor' })).toBeInTheDocument()

    createOfferRequest.resolve({
      success: true,
      data: {
        id: 'offer-1',
        helpRequestId: 'task-1',
        volunteerId: 'volunteer-1',
        message: 'Pot ajuta.',
        status: 'PENDING',
        createdAt: '2026-05-17T10:00:00.000Z',
      },
      message: '',
      status: 201,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Ofertă de ajutor' })).not.toBeInTheDocument()
    })
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
