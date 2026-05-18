import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { backend } from '@/lib/backend'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'
import { AuthSessionBootstrap } from './AuthSessionBootstrap'

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

vi.mock('@/main', () => ({
  authClient: {
    getSession: getSessionMock,
  },
}))

vi.mock('@/lib/backend', () => ({
  backend: {
    auth: {
      clearAuthToken: vi.fn(),
    },
    profile: {
      getMe: vi.fn(),
    },
    volunteers: {
      getMeProfile: vi.fn(),
    },
    offers: {
      listMine: vi.fn(),
    },
  },
}))

function setPersistedAuthenticatedSession() {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      name: 'Ion',
      email: 'ion@example.com',
      accountStatus: 'ACTIVE',
    },
    isGuest: false,
    sessionStatus: 'ready',
    accountStatus: 'active',
    volunteerStatus: 'volunteer',
    knownVolunteerUserIds: {
      'user-1': true,
    },
  })
}

function renderBootstrap(children: ReactNode = <div>Aplicatie</div>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap>{children}</AuthSessionBootstrap>
    </QueryClientProvider>,
  )
}

describe('AuthSessionBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'loading',
      accountStatus: 'unknown',
      volunteerStatus: 'unknown',
      knownVolunteerUserIds: {},
    })
    useVolunteerProfileStore.setState({
      profilesByUserId: {},
    })

    vi.mocked(backend.profile.getMe).mockResolvedValue({
      success: true,
      data: {
        status: 'ACTIVE',
      },
      message: null,
      status: 200,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })
    vi.mocked(backend.volunteers.getMeProfile).mockResolvedValue({
      success: false,
      data: null,
      message: 'Profile not found',
      status: 404,
      isClientError: true,
      isServerError: false,
      isNotFound: true,
      isUnauthorized: false,
      isForbidden: false,
    })
    vi.mocked(backend.offers.listMine).mockResolvedValue({
      success: false,
      data: null,
      message: 'Forbidden',
      status: 403,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: true,
    })
  })

  it('curata sesiunea locala daca backendul nu mai intoarce o sesiune valida', async () => {
    setPersistedAuthenticatedSession()
    getSessionMock.mockResolvedValue({
      data: null,
      error: null,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isGuest).toBe(true)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accountStatus).toBe('unknown')
    expect(useAuthStore.getState().volunteerStatus).toBe('unknown')
  })

  it('curata sesiunea locala daca getSession intoarce response.error', async () => {
    setPersistedAuthenticatedSession()
    getSessionMock.mockResolvedValue({
      data: null,
      error: { message: 'unauthorized' },
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isGuest).toBe(true)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accountStatus).toBe('unknown')
    expect(useAuthStore.getState().volunteerStatus).toBe('unknown')
  })

  it('curata sesiunea locala daca getSession arunca exceptie', async () => {
    setPersistedAuthenticatedSession()
    getSessionMock.mockRejectedValue(new Error('network failed'))

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isGuest).toBe(true)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accountStatus).toBe('unknown')
    expect(useAuthStore.getState().volunteerStatus).toBe('unknown')
  })

  it('pastreaza accountStatus-ul din profilul returnat de backend', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          role: 'requester',
        },
      },
      error: null,
    })
    vi.mocked(backend.profile.getMe).mockResolvedValue({
      success: false,
      data: null,
      message: null,
      status: 403,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: true,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().accountStatus).toBe('blocked')
    expect(useAuthStore.getState().isGuest).toBe(false)
  })

  it('nu mosteneste statutul global de voluntar pentru un alt cont din acelasi browser', async () => {
    useAuthStore.setState({
      user: {
        id: 'old-user',
        name: 'Voluntar Vechi',
        email: 'vechi@example.com',
      },
      isGuest: false,
      sessionStatus: 'ready',
      accountStatus: 'active',
      volunteerStatus: 'volunteer',
      knownVolunteerUserIds: {
        'old-user': true,
      },
    })
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'new-user',
          name: 'Cont Nou',
          email: 'nou@example.com',
          role: 'requester',
        },
      },
      error: null,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().user?.id).toBe('new-user')
    expect(useAuthStore.getState().volunteerStatus).toBe('not-volunteer')
    expect(useAuthStore.getState().knownVolunteerUserIds).toEqual({
      'old-user': true,
    })
  })

  it('hidrateaza store-ul de voluntar din profilul remote la bootstrap', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          role: 'requester',
        },
      },
      error: null,
    })
    vi.mocked(backend.profile.getMe).mockResolvedValue({
      success: true,
      data: {
        hiddenIdentity: true,
        status: 'ACTIVE',
      },
      message: null,
      status: 200,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })
    vi.mocked(backend.volunteers.getMeProfile).mockResolvedValue({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: 'user-1', availability: false },
          profile: {
            currentLocation: { x: 23.5899542, y: 46.769379 },
            maxDistanceKm: 12.5,
            knownLocations: [
              {
                city: 'Cluj-Napoca',
                addressText: 'Centru',
                location: { x: 23.5899542, y: 46.769379 },
              },
            ],
            skills: ['transport'],
          },
        },
      },
      message: null,
      status: 200,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        hiddenIdentity: true,
        location: 'Cluj-Napoca',
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        availability: false,
        maxDistanceKm: 12.5,
        knownLocations: [
          {
            city: 'Cluj-Napoca',
            addressText: 'Centru',
            location: { x: 23.5899542, y: 46.769379 },
          },
        ],
        skills: ['transport'],
      })
      expect(useAuthStore.getState().volunteerStatus).toBe('volunteer')
    })
  })

  it('hidrateaza store-ul de voluntar din draft local cand backend-ul intoarce 404', async () => {
    localStorage.setItem(
      'mvcr-volunteer-profile-draft:user-1',
      JSON.stringify({
        currentLocation: 'Cluj-Napoca',
        hiddenIdentity: false,
        knownLocations: [],
        maxDistanceKm: '15',
        selectedCity: '',
        skillInput: '',
        skills: ['transport'],
        specificAddress: '',
      }),
    )
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          role: 'requester',
        },
      },
      error: null,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        hiddenIdentity: false,
        location: 'Cluj-Napoca',
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        skills: ['transport'],
      })
      expect(useAuthStore.getState().volunteerStatus).toBe('volunteer')
      expect(useAuthStore.getState().knownVolunteerUserIds).toMatchObject({
        'user-1': true,
      })
    })
    expect(backend.offers.listMine).not.toHaveBeenCalled()
  })

  it('sterge profilul local de voluntar daca backend-ul nu il gaseste si nu exista fallback local', async () => {
    useVolunteerProfileStore.setState({
      profilesByUserId: {
        'user-1': {
          userId: 'user-1',
          location: 'Cluj-Napoca',
          locationCoordinates: { x: 23.5899542, y: 46.769379 },
          skills: ['transport'],
          hiddenIdentity: false,
          createdAt: '2026-05-17T00:00:00.000Z',
          updatedAt: '2026-05-17T00:00:00.000Z',
        },
      },
    })
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          role: 'requester',
        },
      },
      error: null,
    })

    renderBootstrap()

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeUndefined()
    })
  })
})
