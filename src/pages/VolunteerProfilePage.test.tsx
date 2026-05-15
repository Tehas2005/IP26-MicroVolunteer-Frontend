// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import VolunteerProfilePage from './VolunteerProfilePage'

const { mockGetByUserId, mockUpdateMe } = vi.hoisted(() => ({
  mockGetByUserId: vi.fn(),
  mockUpdateMe: vi.fn(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { id: string; name: string } }) => unknown) =>
    selector({
      user: { id: '1', name: 'Test User' },
    }),
}))

vi.mock('@/lib/backend', () => ({
  backend: {
    profile: {
      getByUserId: mockGetByUserId,
      updateMe: mockUpdateMe,
    },
  },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

function renderPage() {
  return render(
    <BrowserRouter>
      <VolunteerProfilePage />
    </BrowserRouter>,
  )
}

describe('VolunteerProfilePage - Locație și Distanță (FE-005-A)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockGetByUserId.mockReset()
    mockUpdateMe.mockReset()

    mockGetByUserId.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })
    mockUpdateMe.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('randează corect câmpurile pentru distanță și locație', () => {
    renderPage()

    expect(screen.getByText(/Zona si distanta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Distanta maxima/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Locatia curenta/i)).toBeInTheDocument()
    expect(screen.getByText(/Locatii cunoscute/i)).toBeInTheDocument()
  })

  it('persistă datele locale la refresh chiar dacă profilul încă se încarcă din backend', async () => {
    const profileRequest = deferred<{
      success: boolean
      data: { hiddenIdentity: boolean }
    }>()

    mockGetByUserId.mockImplementation(() => profileRequest.promise)

    const user = userEvent.setup()
    const { unmount } = renderPage()

    await user.type(screen.getByLabelText(/Distanta maxima/i), '12.5')
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Cluj-Napoca')

    await waitFor(() => {
      const rawDraft = window.localStorage.getItem('mvcr-volunteer-profile-draft:1')
      expect(rawDraft).not.toBeNull()

      const parsedDraft = JSON.parse(rawDraft ?? '{}') as {
        currentLocation?: string
        maxDistanceKm?: string
      }

      expect(parsedDraft.maxDistanceKm).toBe('12.5')
      expect(parsedDraft.currentLocation).toBe('Cluj-Napoca')
    })

    unmount()

    mockGetByUserId.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })

    renderPage()

    expect(screen.getByLabelText(/Distanta maxima/i)).toHaveValue(12.5)
    expect(screen.getByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')

    profileRequest.reject(new Error('cancelled'))
  })
})
