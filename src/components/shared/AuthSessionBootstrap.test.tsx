import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthSessionBootstrap } from './AuthSessionBootstrap'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

const { getSessionMock, getByUserIdMock, getVolunteerProfileMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getByUserIdMock: vi.fn(),
  getVolunteerProfileMock: vi.fn(),
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
      getByUserId: getByUserIdMock,
    },
    volunteerProfiles: {
      getMe: getVolunteerProfileMock,
    },
  },
}))

describe('AuthSessionBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'loading',
    })
    useVolunteerProfileStore.setState({
      profilesByUserId: {},
    })

    getByUserIdMock.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })
    getVolunteerProfileMock.mockResolvedValue({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: 'user-1' },
          profile: {
            currentLocation: { x: 23.5899542, y: 46.769379 },
            skills: ['transport'],
          },
        },
      },
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

  it('curata sesiunea locala daca getSession intoarce response.error', async () => {
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
      error: { message: 'unauthorized' },
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

  it('curata sesiunea locala daca getSession arunca exceptie', async () => {
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

    getSessionMock.mockRejectedValue(new Error('network failed'))

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

  it('pastreaza accountStatus-ul din sesiunea returnata de backend', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          accountstatus: 'blocked',
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

    expect(useAuthStore.getState().user?.accountStatus).toBe('BLOCKED')
    expect(useAuthStore.getState().isGuest).toBe(false)
  })

  it('hidrateaza store-ul de voluntar imediat dupa bootstrap-ul sesiunii', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          accountstatus: 'active',
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
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        hiddenIdentity: false,
        location: 'Cluj-Napoca',
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        skills: ['transport'],
      })
    })
  })

  it('sterge profilul local de voluntar daca backend-ul nu mai gaseste profilul remote', async () => {
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
          accountstatus: 'active',
        },
      },
      error: null,
    })
    getVolunteerProfileMock.mockResolvedValue({
      success: false,
      data: null,
      message: 'not found',
      status: 404,
      isClientError: true,
      isServerError: false,
      isNotFound: true,
      isUnauthorized: false,
      isForbidden: false,
    })

    render(
      <AuthSessionBootstrap>
        <div>Aplicatie</div>
      </AuthSessionBootstrap>,
    )

    await waitFor(() => {
      expect(screen.getByText('Aplicatie')).toBeInTheDocument()
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeUndefined()
    })
  })
})
