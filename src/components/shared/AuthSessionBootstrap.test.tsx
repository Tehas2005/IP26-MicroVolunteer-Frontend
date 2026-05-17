import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthSessionBootstrap } from './AuthSessionBootstrap'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

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
    profile: {
      getMe: vi.fn(),
    },
    volunteers: {
      getMeProfile: vi.fn(),
    },
    offers: {
      listMine: vi.fn(),
    },
    auth: {
      clearAuthToken: vi.fn(),
    },
  },
}))

import { backend } from '@/lib/backend'

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
    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Ion',
        email: 'ion@example.com',
        accountStatus: 'ACTIVE',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })

    getSessionMock.mockResolvedValue({
      data: null,
      error: null,
    })

    render(
      <AuthSessionBootstrap>
        <div>Aplicatie</div>
      </AuthSessionBootstrap>,
    )

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isGuest).toBe(true)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('curata sesiunea persistata daca bootstrap-ul arunca o eroare', async () => {
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

    getSessionMock.mockRejectedValue(new Error('network down'))

    render(
      <AuthSessionBootstrap>
        <div>Aplicatie</div>
      </AuthSessionBootstrap>,
    )

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
      isForbidden: true,
      data: null,
      message: null,
      status: 403,
      isClientError: true,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
    })

    render(
      <AuthSessionBootstrap>
        <div>Aplicatie</div>
      </AuthSessionBootstrap>,
    )

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

    render(
      <AuthSessionBootstrap>
        <div>Aplicatie</div>
      </AuthSessionBootstrap>,
    )

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().user?.id).toBe('new-user')
    expect(useAuthStore.getState().volunteerStatus).toBe('not-volunteer')
    expect(useAuthStore.getState().knownVolunteerUserIds).toEqual({
      'old-user': true,
    })
  })
})
