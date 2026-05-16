import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { backend } from '@/lib/backend'
import { ProfilePage } from '@/pages/ProfilePage'
import { useAuthStore } from '@/store/authStore'

const profileResponse = {
  success: true,
  data: { hiddenIdentity: true },
  message: '',
  status: 200,
  isClientError: false,
  isServerError: false,
  isNotFound: false,
  isUnauthorized: false,
  isForbidden: false,
}

describe('ProfilePage', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    useAuthStore.setState({
      user: null,
      isGuest: true,
      sessionStatus: 'ready',
    })
    localStorage.clear()
    cleanup()
  })

  it('hidrateaza skillurile salvate si pastreaza salvarea prin backend', async () => {
    const user = userEvent.setup()
    const getProfileSpy = vi.spyOn(backend.profile, 'getByUserId').mockResolvedValue(profileResponse)
    const updateProfileSpy = vi.spyOn(backend.profile, 'updateMe').mockResolvedValue(profileResponse)

    useAuthStore.setState({
      user: {
        id: 'user-1',
        name: 'Ion Popescu',
        email: 'ion@example.com',
      },
      isGuest: false,
      sessionStatus: 'ready',
    })
    localStorage.setItem('mvcr-profile-skills:user-1', JSON.stringify(['transport']))

    render(<ProfilePage />)

    expect(await screen.findByText('transport')).toBeInTheDocument()
    expect(getProfileSpy).toHaveBeenCalledWith('user-1')
    expect(screen.getByRole('button', { name: 'Ascunde identitatea' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salveaza Profilul' })).not.toBeDisabled()
    })
    await user.click(screen.getByRole('button', { name: 'Salveaza Profilul' }))

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalledWith({ hiddenIdentity: true })
    })

    expect(
      await screen.findByText('Setarile profilului au fost salvate.', {}, { timeout: 3000 }),
    ).toBeInTheDocument()
  })
})
