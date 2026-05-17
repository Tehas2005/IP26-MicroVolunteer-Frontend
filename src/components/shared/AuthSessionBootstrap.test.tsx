import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthSessionBootstrap } from './AuthSessionBootstrap'
import { useAuthStore } from '@/store/authStore'

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

vi.mock('@/main', () => ({
  authClient: {
    getSession: getSessionMock,
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
})
