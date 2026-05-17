import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    vi.spyOn(backend.profile, 'create').mockResolvedValue(createSuccessResponse({ hiddenIdentity: false }))
    vi.spyOn(backend.profile, 'updateMe').mockResolvedValue(createSuccessResponse({ hiddenIdentity: false }))
    vi.spyOn(backend.users, 'becomeVolunteer').mockResolvedValue(createSuccessResponse({ success: true }))
    vi.spyOn(backend.volunteers, 'getMeProfile').mockResolvedValue(createNotFoundResponse())
    vi.spyOn(backend.volunteers, 'createMeProfile').mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: false }),
    )
    vi.spyOn(backend.volunteers, 'updateMeProfile').mockResolvedValue(
      createSuccessResponse({ hiddenIdentity: false }),
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
    render(<ProfilePage />)

    expect(screen.getByRole('heading', { name: 'Devino voluntar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Incepe acum' }))

    expect(screen.getByRole('button', { name: 'Locatie voluntar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salveaza Profilul' })).toBeInTheDocument()
  })

  it('afiseaza direct setarile cand sesiunea spune ca userul este deja voluntar', async () => {
    setAuthenticatedSession('volunteer')

    render(<ProfilePage />)

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

    render(<ProfilePage />)

    expect(screen.getByRole('heading', { name: 'Setari profil voluntar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Incepe acum' })).not.toBeInTheDocument()
  })

  it('hidrateaza skillurile salvate si pastreaza salvarea prin backend', async () => {
    const user = userEvent.setup()
    const getVolunteerProfileSpy = vi.mocked(backend.volunteers.getMeProfile)
      .mockResolvedValueOnce(
        createSuccessResponse({
          hiddenIdentity: true,
          city: 'Cluj-Napoca',
          skills: ['transport'],
        }),
      )
      .mockResolvedValue(
        createSuccessResponse({
          hiddenIdentity: true,
          city: 'Cluj-Napoca',
          skills: ['transport'],
        }),
      )
    const updateVolunteerProfileSpy = vi.mocked(backend.volunteers.updateMeProfile)

    setAuthenticatedSession('volunteer')
    localStorage.setItem('mvcr-profile-skills:user-1', JSON.stringify(['transport']))
    render(<ProfilePage />)

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
            city: 'Cluj-Napoca',
            hiddenIdentity: true,
            skills: ['transport'],
          }),
        )
        expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toMatchObject({
          location: 'Cluj-Napoca',
          skills: ['transport'],
          hiddenIdentity: true,
        })
      },
      { timeout: 2500 },
    )
  })

  it('creeaza profilul local de voluntar dupa completarea locatiei si abilitatilor', async () => {
    const user = userEvent.setup()
    vi.mocked(backend.volunteers.getMeProfile)
      .mockResolvedValueOnce(createNotFoundResponse())
      .mockResolvedValueOnce(
        createSuccessResponse({
          hiddenIdentity: false,
          city: 'Cluj-Napoca',
          skills: ['Transport local'],
        }),
      )

    setAuthenticatedSession()
    render(<ProfilePage />)

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
            city: 'Cluj-Napoca',
            skills: ['Transport local'],
            hiddenIdentity: false,
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
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Incepe acum' }))
    await user.click(screen.getByRole('button', { name: 'Transport local' }))
    await user.click(await waitForSaveButton())

    expect(await screen.findByText('adauga locatia in care poti ajuta')).toBeInTheDocument()
    expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeUndefined()
  })

  it('afiseaza confirmarea de renuntare fara sa stearga profilul local daca backendul nu are endpoint dedicat', async () => {
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
          createdAt: '2026-05-15T00:00:00.000Z',
          updatedAt: '2026-05-15T00:00:00.000Z',
        },
      },
    })

    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Renunta la statutul de voluntar' }))

    expect(
      screen.getByText('Esti sigur ca vrei sa stergi profilul tau de voluntar?'),
    ).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(screen.getByRole('button', { name: 'Anuleaza' }))

    expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeDefined()
    expect(document.body.style.overflow).toBe('')

    await user.click(screen.getByRole('button', { name: 'Renunta la statutul de voluntar' }))
    await user.click(screen.getByRole('button', { name: 'Da, renunt' }))

    expect(useVolunteerProfileStore.getState().profilesByUserId['user-1']).toBeDefined()
    expect(document.body.style.overflow).toBe('')
    expect(
      screen.getByText(
        'Renuntarea la statutul de voluntar nu este inca legata la un endpoint backend dedicat.',
      ),
    ).toBeInTheDocument()
  })
})
