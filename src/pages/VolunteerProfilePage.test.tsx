// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

import VolunteerProfilePage from './VolunteerProfilePage'

const {
  mockCreateVolunteerProfile,
  mockGetByUserId,
  mockGetVolunteerProfile,
  mockUpdateMe,
  mockUpdateVolunteerProfile,
} = vi.hoisted(() => ({
  mockCreateVolunteerProfile: vi.fn(),
  mockGetByUserId: vi.fn(),
  mockGetVolunteerProfile: vi.fn(),
  mockUpdateMe: vi.fn(),
  mockUpdateVolunteerProfile: vi.fn(),
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
    volunteerProfiles: {
      createMe: mockCreateVolunteerProfile,
      getMe: mockGetVolunteerProfile,
      updateMe: mockUpdateVolunteerProfile,
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
  return render(<VolunteerProfilePage />)
}

describe('VolunteerProfilePage - Locație și Distanță (FE-005-A)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.confirm = vi.fn(() => true)
    useVolunteerProfileStore.setState({
      profilesByUserId: {},
    })
    mockCreateVolunteerProfile.mockReset()
    mockGetByUserId.mockReset()
    mockGetVolunteerProfile.mockReset()
    mockUpdateMe.mockReset()
    mockUpdateVolunteerProfile.mockReset()

    mockGetByUserId.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })
    mockGetVolunteerProfile.mockResolvedValue({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: '1' },
          profile: null,
        },
      },
    })
    mockCreateVolunteerProfile.mockResolvedValue({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: '1' },
          profile: {
            maxDistanceKm: 12.5,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            knownLocations: [],
            skills: [],
          },
        },
      },
    })
    mockUpdateMe.mockResolvedValue({
      success: true,
      data: { hiddenIdentity: false },
    })
    mockUpdateVolunteerProfile.mockResolvedValue({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: '1' },
          profile: {
            maxDistanceKm: 12.5,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            knownLocations: [],
            skills: [],
          },
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    useVolunteerProfileStore.setState({
      profilesByUserId: {},
    })
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

  it('reinitializeaza persistenta chiar daca draftul din localStorage este corupt', async () => {
    window.localStorage.setItem('mvcr-volunteer-profile-draft:1', '{invalid-json')

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByLabelText(/Locatia curenta/i)).toHaveValue('')

    await user.type(screen.getByLabelText(/Distanta maxima/i), '14')
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Cluj-Napoca')

    await waitFor(() => {
      const rawDraft = window.localStorage.getItem('mvcr-volunteer-profile-draft:1')
      expect(rawDraft).not.toBeNull()
      expect(() => JSON.parse(rawDraft ?? '')).not.toThrow()
      expect(JSON.parse(rawDraft ?? '{}')).toMatchObject({
        currentLocation: 'Cluj-Napoca',
        maxDistanceKm: '14',
      })
    })
  })

  it('reseteaza formularul la ultima stare hidratata, nu la un draft gol', async () => {
    window.localStorage.setItem(
      'mvcr-volunteer-profile-draft:1',
      JSON.stringify({
        currentLocation: 'Cluj-Napoca',
        hiddenIdentity: true,
        knownLocations: [{ city: 'Iasi', address: 'Copou' }],
        maxDistanceKm: '18',
        selectedCity: '',
        skillInput: '',
        skills: ['transport'],
        specificAddress: '',
      }),
    )

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')

    await user.clear(screen.getByLabelText(/Locatia curenta/i))
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Iasi')
    await user.click(screen.getByRole('button', { name: /Reseteaza modificarile/i }))

    expect(screen.getByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')
    expect(screen.getByText('Iasi | Copou')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sterge abilitatea transport/i })).toBeInTheDocument()
  })

  it('salveaza profilul de voluntar prin endpoint-ul dedicat cand backend-ul este disponibil', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/Distanta maxima/i), '12.5')
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Cluj-Napoca')
    await user.click(screen.getByRole('button', { name: /Salveaza profilul/i }))

    await waitFor(() => {
      expect(mockCreateVolunteerProfile).toHaveBeenCalledWith({
        currentLocation: { x: 23.5899542, y: 46.769379 },
        knownLocations: [],
        maxDistanceKm: 12.5,
        skills: [],
      })
      expect(mockUpdateMe).toHaveBeenCalledWith({ hiddenIdentity: false })
      expect(useVolunteerProfileStore.getState().profilesByUserId['1']).toMatchObject({
        hiddenIdentity: false,
        location: 'Cluj-Napoca',
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        skills: [],
      })
    })
  })

  it('actualizeaza store-ul si pe fallback local cand endpoint-ul de voluntar nu este disponibil', async () => {
    mockCreateVolunteerProfile.mockResolvedValueOnce({
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
    mockUpdateVolunteerProfile.mockResolvedValueOnce({
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
    mockUpdateMe.mockResolvedValueOnce({
      success: true,
      data: { hiddenIdentity: false },
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/Distanta maxima/i), '16')
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Cluj-Napoca')
    await user.click(screen.getByRole('button', { name: /Salveaza profilul/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          /Datele au fost salvate local. Sincronizarea cu backend-ul pentru profilul de voluntar nu este inca disponibila./i,
        ),
      ).toBeInTheDocument()
      expect(useVolunteerProfileStore.getState().profilesByUserId['1']).toMatchObject({
        hiddenIdentity: false,
        location: 'Cluj-Napoca',
        locationCoordinates: { x: 23.5899542, y: 46.769379 },
        skills: [],
      })
    })
  })

  it('nu reseteaza la un draft care a esuat la sincronizare', async () => {
    window.localStorage.setItem(
      'mvcr-volunteer-profile-draft:1',
      JSON.stringify({
        currentLocation: 'Cluj-Napoca',
        hiddenIdentity: false,
        knownLocations: [{ city: 'Iasi', address: 'Copou' }],
        maxDistanceKm: '18',
        selectedCity: '',
        skillInput: '',
        skills: ['transport'],
        specificAddress: '',
      }),
    )

    mockCreateVolunteerProfile.mockResolvedValueOnce({
      success: false,
      data: null,
      message: 'sync failed',
      status: 500,
      isClientError: false,
      isServerError: true,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })
    mockUpdateMe.mockResolvedValueOnce({
      success: false,
      data: null,
      message: 'privacy failed',
      status: 500,
      isClientError: false,
      isServerError: true,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')

    await user.clear(screen.getByLabelText(/Locatia curenta/i))
    await user.type(screen.getByLabelText(/Locatia curenta/i), 'Iasi')
    await user.clear(screen.getByLabelText(/Distanta maxima/i))
    await user.type(screen.getByLabelText(/Distanta maxima/i), '25')
    await user.click(screen.getByRole('button', { name: /Comuta ascunderea identitatii/i }))
    await user.click(screen.getByRole('button', { name: /Salveaza profilul/i }))

    await waitFor(() => {
      expect(mockCreateVolunteerProfile).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /Salveaza profilul/i })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: /Reseteaza modificarile/i }))

    expect(screen.getByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')
    expect(screen.getByLabelText(/Distanta maxima/i)).toHaveValue(18)
  })

  it('rescrie hiddenIdentity in storage daca sincronizarea confidentialitatii esueaza', async () => {
    window.localStorage.setItem(
      'mvcr-volunteer-profile-draft:1',
      JSON.stringify({
        currentLocation: 'Cluj-Napoca',
        hiddenIdentity: false,
        knownLocations: [],
        maxDistanceKm: '18',
        selectedCity: '',
        skillInput: '',
        skills: [],
        specificAddress: '',
      }),
    )

    mockCreateVolunteerProfile.mockResolvedValueOnce({
      success: true,
      data: {
        data: {
          volunteer: { id: 1, userId: '1' },
          profile: {
            maxDistanceKm: 18,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            knownLocations: [],
            skills: [],
          },
        },
      },
    })
    mockUpdateMe.mockResolvedValueOnce({
      success: false,
      data: null,
      message: 'privacy failed',
      status: 500,
      isClientError: false,
      isServerError: true,
      isNotFound: false,
      isUnauthorized: false,
      isForbidden: false,
    })

    const user = userEvent.setup()
    const { unmount } = renderPage()

    expect(await screen.findByLabelText(/Locatia curenta/i)).toHaveValue('Cluj-Napoca')

    await user.click(screen.getByRole('button', { name: /Comuta ascunderea identitatii/i }))
    await user.click(screen.getByRole('button', { name: /Salveaza profilul/i }))

    await waitFor(() => {
      expect(
        screen.getByText(
          /Datele profilului de voluntar au fost salvate. Confidentialitatea nu a putut fi sincronizata./i,
        ),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Comuta ascunderea identitatii/i })).toHaveClass(
        'bg-gray-300',
      )
    })

    const rawDraft = window.localStorage.getItem('mvcr-volunteer-profile-draft:1')
    expect(rawDraft).not.toBeNull()
    expect(JSON.parse(rawDraft ?? '{}')).toMatchObject({ hiddenIdentity: false })

    unmount()
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Comuta ascunderea identitatii/i })).toHaveClass(
        'bg-gray-300',
      )
    })
  })
})
