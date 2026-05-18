import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { backend } from '@/lib/backend'
import { ProfilePage } from '@/pages/ProfilePage'
import type { ApiResponse } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    message: '',
    status: 200,
    isClientError: false,
    isServerError: false,
    isNotFound: false,
    isUnauthorized: false,
    isForbidden: false,
  }
}

function createNotFoundResponse<T>(): ApiResponse<T> {
  return {
    success: false,
    data: null,
    message: 'Volunteer profile not found',
    status: 404,
    isClientError: true,
    isServerError: false,
    isNotFound: true,
    isUnauthorized: false,
    isForbidden: false,
  }
}

function createVolunteerProfileData(options?: {
  availability?: boolean
  currentLocation?: { x: number; y: number }
  knownLocations?: {
    city?: string | null
    addressText?: string | null
    location: { x: number; y: number }
  }[]
  maxDistanceKm?: number | null
  skills?: string[]
}) {
  return {
    volunteer: {
      id: 1,
      userId: 'user-1',
      availability: options?.availability ?? true,
    },
    profile: {
      id: 1,
      volunteerId: 1,
      currentLocation: options?.currentLocation ?? {
        x: 23.5899542,
        y: 46.769379,
      },
      maxDistanceKm: options?.maxDistanceKm ?? null,
      knownLocations: options?.knownLocations ?? [],
      skills: options?.skills ?? [],
    },
  }
}

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>,
  )
}

function setAuthenticatedSession(role?: string | null) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      name: 'Ion Socol',
      email: 'ion@example.com',
      role: role ?? null,
    },
    isGuest: false,
    sessionStatus: 'ready',
    volunteerStatus: 'unknown',
    knownVolunteerUserIds: {},
  })
}

function resetStores() {
  useAuthStore.setState({
    user: null,
    isGuest: true,
    sessionStatus: 'ready',
    volunteerStatus: 'unknown',
    knownVolunteerUserIds: {},
  })
  useVolunteerProfileStore.setState({
    profilesByUserId: {},
  })
}

async function waitForSaveButton() {
  const saveButton = screen.getByRole('button', { name: 'Salveaza Profilul' })

  await waitFor(() => {
    expect(saveButton).not.toBeDisabled()
  })

  return saveButton
}

describe('ProfilePage volunteer profile', () => {
  beforeEach(() => {
    resetStores()
    localStorage.clear()
    vi.spyOn(backend.profile, 'create').mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: false }),
    )
    vi.spyOn(backend.profile, 'getMe').mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: false }),
    )
    vi.spyOn(backend.profile, 'updateMe').mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: false }),
    )
    vi.spyOn(backend.users, 'becomeVolunteer').mockResolvedValue(
      createSuccessResponse({
        message: 'You are now a volunteer',
        volunteerId: 1,
      }),
    )
    vi.spyOn(backend.volunteers, 'getMeProfile').mockResolvedValue(createNotFoundResponse())
    vi.spyOn(backend.volunteers, 'createMeProfile').mockResolvedValue(
      createSuccessResponse(createVolunteerProfileData()),
    )
    vi.spyOn(backend.volunteers, 'updateMeProfile').mockResolvedValue(
      createSuccessResponse(createVolunteerProfileData()),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
    localStorage.clear()
    document.body.style.overflow = ''
    cleanup()
  })

  it('afiseaza onboardingul si deschide formularul de voluntar', async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Devino voluntar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Incepe acum' }))

    expect(screen.getByRole('button', { name: 'Locatie voluntar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salveaza Profilul' })).toBeInTheDocument()
  })

  it('afiseaza direct setarile cand sesiunea spune ca userul este deja voluntar', async () => {
    setAuthenticatedSession('volunteer')

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Setari profil voluntar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Incepe acum' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salveaza Profilul' })).toBeInTheDocument()
  })

  it('pastreaza ecranul de voluntar dupa relogare daca userul este deja cunoscut local ca voluntar', async () => {
    setAuthenticatedSession()
    useAuthStore.setState({
      knownVolunteerUserIds: {
        'user-1': true,
      },
    })

    renderProfilePage()

    expect(screen.getByRole('heading', { name: 'Setari profil voluntar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Incepe acum' })).not.toBeInTheDocument()
  })

  it('hidrateaza skillurile salvate si pastreaza salvarea prin backend', async () => {
    const user = userEvent.setup()
    const getVolunteerProfileSpy = vi
      .mocked(backend.volunteers.getMeProfile)
      .mockResolvedValueOnce(
        createSuccessResponse(
          createVolunteerProfileData({
            availability: false,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            maxDistanceKm: 12.5,
            skills: ['transport'],
          }),
        ),
      )
      .mockResolvedValue(
        createSuccessResponse(
          createVolunteerProfileData({
            availability: false,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            maxDistanceKm: 12.5,
            skills: ['transport'],
          }),
        ),
      )
    vi.mocked(backend.profile.getMe).mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: true }),
    )
    const updateVolunteerProfileSpy = vi.mocked(backend.volunteers.updateMeProfile)

    setAuthenticatedSession('volunteer')
    localStorage.setItem('mvcr-profile-skills:user-1', JSON.stringify(['transport']))
    renderProfilePage()

    await waitFor(() => {
      expect(getVolunteerProfileSpy).toHaveBeenCalled()
    })

    expect(await screen.findByText('transport')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ascunde identitatea' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Locatie voluntar' }))
    await user.click(screen.getByRole('option', { name: 'Cluj-Napoca' }))
    await user.click(await waitForSaveButton())

    await waitFor(
      () => {
        expect(updateVolunteerProfileSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            availability: false,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            maxDistanceKm: 12.5,
            skills: ['transport'],
          }),
        )
        expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
          location: 'Cluj-Napoca',
          availability: false,
          maxDistanceKm: 12.5,
          skills: ['transport'],
          hiddenIdentity: true,
        })
      },
      { timeout: 2500 },
    )
  })

  it('sincronizeaza profilul de voluntar din backend peste datele locale vechi', async () => {
    setAuthenticatedSession('volunteer')
    useVolunteerProfileStore.setState({
      profilesByUserId: {
        'user-1': {
          userId: 'user-1',
          location: 'Iasi',
          locationCoordinates: { x: 27.6014418, y: 47.1584549 },
          skills: ['abilitate veche'],
          hiddenIdentity: false,
          availability: true,
          maxDistanceKm: 3,
          knownLocations: [],
          createdAt: '2026-05-15T00:00:00.000Z',
          updatedAt: '2026-05-15T00:00:00.000Z',
        },
      },
    })
    vi.mocked(backend.profile.getMe).mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: true }),
    )
    vi.mocked(backend.volunteers.getMeProfile).mockResolvedValue(
      createSuccessResponse(
        createVolunteerProfileData({
          availability: false,
          currentLocation: { x: 23.5899542, y: 46.769379 },
          knownLocations: [
            {
              city: 'Cluj-Napoca',
              addressText: 'Centru',
              location: { x: 23.5899542, y: 46.769379 },
            },
          ],
          maxDistanceKm: 12.5,
          skills: ['transport'],
        }),
      ),
    )

    renderProfilePage()

    await waitFor(() => {
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        location: 'Cluj-Napoca',
        availability: false,
        maxDistanceKm: 12.5,
        skills: ['transport'],
        hiddenIdentity: true,
        knownLocations: [
          {
            city: 'Cluj-Napoca',
            addressText: 'Centru',
            location: { x: 23.5899542, y: 46.769379 },
          },
        ],
      })
    })
    expect(await screen.findByText('transport')).toBeInTheDocument()
    expect(screen.getByText('Nu primesti alerte pentru cereri potrivite.')).toBeInTheDocument()
  })

  it('creeaza profilul local de voluntar dupa completarea locatiei si abilitatilor', async () => {
    const user = userEvent.setup()
    vi.mocked(backend.volunteers.getMeProfile)
      .mockResolvedValueOnce(createNotFoundResponse())
      .mockResolvedValueOnce(
        createSuccessResponse(
          createVolunteerProfileData({
            currentLocation: { x: 23.5899542, y: 46.769379 },
            skills: ['Transport local'],
          }),
        ),
      )

    setAuthenticatedSession()
    renderProfilePage()

    await user.click(screen.getByRole('button', { name: 'Incepe acum' }))
    await user.click(screen.getByRole('button', { name: 'Locatie voluntar' }))
    expect(screen.getByRole('option', { name: 'Cluj-Napoca' })).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Cluj-Napoca' }))
    await user.click(screen.getByRole('button', { name: 'Transport local' }))
    await user.click(await waitForSaveButton())

    await waitFor(
      () => {
        expect(backend.users.becomeVolunteer).toHaveBeenCalled()
        expect(backend.volunteers.createMeProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            availability: true,
            currentLocation: { x: 23.5899542, y: 46.769379 },
            maxDistanceKm: null,
            skills: ['Transport local'],
          }),
        )
        expect(useAuthStore.getState().volunteerStatus).toBe('volunteer')
        expect(screen.getByRole('heading', { name: 'Setari profil voluntar' })).toBeInTheDocument()
      },
      { timeout: 4000 },
    )
  })

  it('cere selectarea unui oras din lista', async () => {
    const user = userEvent.setup()

    setAuthenticatedSession()
    renderProfilePage()

    await user.click(screen.getByRole('button', { name: 'Incepe acum' }))
    await user.click(screen.getByRole('button', { name: 'Transport local' }))
    await user.click(await waitForSaveButton())

    expect(await screen.findByText('adauga locatia in care poti ajuta')).toBeInTheDocument()
    expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeUndefined()
  })

  it('dezactiveaza si reactiveaza disponibilitatea voluntarului prin endpointul de profil', async () => {
    const user = userEvent.setup()

    setAuthenticatedSession('volunteer')
    useVolunteerProfileStore.setState({
      profilesByUserId: {
        'user-1': {
          userId: 'user-1',
          location: 'Cluj-Napoca',
          locationCoordinates: { x: 23.5899542, y: 46.769379 },
          skills: ['Transport local'],
          hiddenIdentity: false,
          availability: true,
          createdAt: '2026-05-15T00:00:00.000Z',
          updatedAt: '2026-05-15T00:00:00.000Z',
        },
      },
    })

    renderProfilePage()

    expect(screen.getByText('Primesti alerte pentru cereri potrivite.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Distanta maxima (km)'), {
      target: { value: 'abc' },
    })

    await user.click(screen.getByRole('button', { name: 'Dezactiveaza disponibilitatea' }))

    expect(screen.getByText('Vrei sa dezactivezi disponibilitatea?')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(screen.getByRole('button', { name: 'Anuleaza' }))

    expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeDefined()
    expect(document.body.style.overflow).toBe('')

    await user.click(screen.getByRole('button', { name: 'Dezactiveaza disponibilitatea' }))
    await user.click(screen.getByRole('button', { name: 'Da, dezactiveaza' }))

    await waitFor(() => {
      expect(backend.volunteers.updateMeProfile).toHaveBeenCalledWith({
        availability: false,
      })
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        availability: false,
        maxDistanceKm: null,
      })
    })
    expect(document.body.style.overflow).toBe('')
    expect(screen.getByText('Disponibilitatea de voluntar a fost dezactivata.')).toBeInTheDocument()
    expect(screen.getByText('Nu primesti alerte pentru cereri potrivite.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reactiveaza disponibilitatea' }))

    await waitFor(() => {
      expect(backend.volunteers.updateMeProfile).toHaveBeenCalledWith({
        availability: true,
      })
      expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
        availability: true,
      })
    })
    expect(screen.getByText('Disponibilitatea de voluntar a fost reactivata.')).toBeInTheDocument()
  })
})
