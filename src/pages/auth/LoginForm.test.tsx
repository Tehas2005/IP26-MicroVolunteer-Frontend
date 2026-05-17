import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { backend } from '@/lib/backend'
import { BLOCKED_LOGIN_MESSAGE } from '@/lib/accountStatus'
import { LoginForm } from './LoginForm'

const { signInEmailMock } = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
}))

vi.mock('@/main', () => ({
  authClient: {
    signIn: {
      email: signInEmailMock,
    },
  },
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('afiseaza eroarea ceruta si nu finalizeaza loginul pentru un cont blocat', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const signOutSpy = vi.spyOn(backend.auth, 'signOut').mockResolvedValue({
      data: { success: true },
      message: null,
      success: true,
      status: 200,
      isClientError: false,
      isServerError: false,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })
    const clearAuthTokenSpy = vi
      .spyOn(backend.auth, 'clearAuthToken')
      .mockImplementation(() => {})

    signInEmailMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Ion',
          email: 'ion@example.com',
          accountStatus: 'BLOCKED',
        },
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <LoginForm onSuccess={onSuccess} onSwitch={vi.fn()} />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText('anna@gmail.com'), 'ion@example.com')
    await user.type(screen.getByPlaceholderText('********'), 'parola123')
    await user.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => {
      expect(screen.getByText(BLOCKED_LOGIN_MESSAGE)).toBeInTheDocument()
    })

    expect(signOutSpy).toHaveBeenCalledTimes(1)
    expect(clearAuthTokenSpy).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
