import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { SkillTagSelector } from '@/components/shared/SkillTagSelector'
import { useBecomeVolunteerMutation, indicatesExistingVolunteer } from '@/hooks/useBecomeVolunteerMutation'
import { backend } from '@/lib/backend'
import {
  ROMANIA_CITY_COORDINATES,
  ROMANIA_CITY_NAMES,
  type TaskLocationPayload,
} from '@/lib/romania-city-coordinates'
import { COMMON_SKILL_SUGGESTIONS } from '@/lib/skillSuggestions'
import { readHiddenIdentityFromResponse } from '@/pages/profile/utils'
import type {
  CreateProfilePayloadType,
  CurrentVolunteerProfileResponseType,
  VolunteerProfilePayloadType,
} from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

const SAVE_DELAY_MS = 1200
const SKILLS_STORAGE_KEY_PREFIX = 'mvcr-profile-skills'
const LOCATION_MATCH_EPSILON = 0.000001

function resolveVolunteerLocation(location: string): TaskLocationPayload | null {
  const normalizedLocation = location.trim()

  if (!normalizedLocation) {
    return null
  }

  return ROMANIA_CITY_COORDINATES[normalizedLocation] ?? null
}

function resolveRomanianCityByPoint(point: TaskLocationPayload | null | undefined) {
  if (!point) {
    return ''
  }

  const matchingCity = Object.entries(ROMANIA_CITY_COORDINATES).find(
    ([, coordinates]) =>
      Math.abs(coordinates.x - point.x) < LOCATION_MATCH_EPSILON &&
      Math.abs(coordinates.y - point.y) < LOCATION_MATCH_EPSILON,
  )

  return matchingCity?.[0] ?? ''
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function readCurrentVolunteerPayload(payload: unknown): CurrentVolunteerProfileResponseType | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload as CurrentVolunteerProfileResponseType
}

function readVolunteerLocationFromPayload(payload: unknown) {
  const currentVolunteerProfile = readCurrentVolunteerPayload(payload)
  const profile = currentVolunteerProfile?.profile

  return (
    resolveRomanianCityByPoint(profile?.currentLocation ?? null) ||
    normalizeString(profile?.knownLocations?.[0]?.city)
  )
}

function readVolunteerSkillsFromPayload(payload: unknown) {
  const currentVolunteerProfile = readCurrentVolunteerPayload(payload)
  const rawValues = currentVolunteerProfile?.profile?.skills

  if (!Array.isArray(rawValues)) {
    return []
  }

  return rawValues
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim())
}

function readVolunteerMaxDistanceFromPayload(payload: unknown) {
  const currentVolunteerProfile = readCurrentVolunteerPayload(payload)
  const maxDistanceKm = currentVolunteerProfile?.profile?.maxDistanceKm

  return typeof maxDistanceKm === 'number' && Number.isFinite(maxDistanceKm)
    ? String(maxDistanceKm)
    : ''
}

function buildGeneralProfilePayload(name: string, hiddenIdentity: boolean): CreateProfilePayloadType {
  return {
    name,
    bio: 'Utilizator activ in platforma Micro-Volunteer Crisis Router.',
    languages: ['ro'],
    hiddenIdentity,
  }
}

function buildVolunteerProfilePayload(options: {
  availability: boolean
  location: TaskLocationPayload
  maxDistanceKm: string
  skills: string[]
}): VolunteerProfilePayloadType {
  const { availability, location, maxDistanceKm, skills } = options
  const parsedDistance = Number(maxDistanceKm.trim())
  const normalizedDistance =
    maxDistanceKm.trim() && Number.isFinite(parsedDistance) && parsedDistance > 0
      ? parsedDistance
      : null

  return {
    availability,
    currentLocation: location,
    maxDistanceKm: normalizedDistance,
    skills,
  }
}

function readAuthUserRole(user: { role?: string | null } | null | undefined) {
  return typeof user?.role === 'string' ? user.role.trim().toLowerCase() : ''
}

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user)
  const volunteerStatus = useAuthStore((state) => state.volunteerStatus)
  const knownVolunteerUserIds = useAuthStore((state) => state.knownVolunteerUserIds)
  const setVolunteerStatus = useAuthStore((state) => state.setVolunteerStatus)
  const rememberVolunteerUser = useAuthStore((state) => state.rememberVolunteerUser)
  const becomeVolunteerMutation = useBecomeVolunteerMutation()
  const volunteerProfile = useVolunteerProfileStore((state) =>
    authUser?.id ? state.profilesByUserId[authUser.id] : undefined,
  )
  const upsertVolunteerProfile = useVolunteerProfileStore((state) => state.upsertVolunteerProfile)
  const deleteVolunteerProfile = useVolunteerProfileStore((state) => state.deleteVolunteerProfile)

  const [isFormVisible, setIsFormVisible] = useState(Boolean(volunteerProfile))
  const [location, setLocation] = useState(volunteerProfile?.location ?? '')
  const [maxDistanceKm, setMaxDistanceKm] = useState(
    volunteerProfile?.maxDistanceKm ? String(volunteerProfile.maxDistanceKm) : '',
  )
  const [hiddenIdentity, setHiddenIdentity] = useState(volunteerProfile?.hiddenIdentity ?? false)
  const [skills, setSkills] = useState<string[]>(volunteerProfile?.skills ?? [])
  const [hasHydratedProfile, setHasHydratedProfile] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLocationListOpen, setIsLocationListOpen] = useState(false)
  const [hasBackendVolunteerProfile, setHasBackendVolunteerProfile] = useState(false)
  const hasVolunteerRole = readAuthUserRole(authUser) === 'volunteer'
  const isKnownVolunteerUser = Boolean(authUser?.id && knownVolunteerUserIds[authUser.id])
  const volunteerStatusRef = useRef(volunteerStatus)
  volunteerStatusRef.current = volunteerStatus

  const isExistingVolunteer = Boolean(
    volunteerProfile ||
      hasBackendVolunteerProfile ||
      volunteerStatus === 'volunteer' ||
      hasVolunteerRole ||
      isKnownVolunteerUser,
  )
  const pageTitle = isExistingVolunteer ? 'Setari profil voluntar' : 'Devino voluntar'
  const selectedLocationCoordinates = resolveVolunteerLocation(location)

  const normalizedSkills = useMemo(
    () => skills.map((skill) => skill.trim()).filter(Boolean),
    [skills],
  )

  const skillsStorageKey = useMemo(() => {
    if (!authUser?.id) {
      return null
    }

    return `${SKILLS_STORAGE_KEY_PREFIX}:${authUser.id}`
  }, [authUser?.id])

  useEffect(() => {
    if (volunteerProfile) {
      setIsFormVisible(true)
      setLocation(volunteerProfile.location)
      setMaxDistanceKm(volunteerProfile.maxDistanceKm ? String(volunteerProfile.maxDistanceKm) : '')
      setSkills(volunteerProfile.skills)
      setHiddenIdentity(volunteerProfile.hiddenIdentity)
      setSaveError('')
      return
    }

    if (
      hasBackendVolunteerProfile ||
      volunteerStatus === 'volunteer' ||
      hasVolunteerRole ||
      isKnownVolunteerUser
    ) {
      setIsFormVisible(true)
      return
    }

    setIsFormVisible(false)
    setLocation('')
    setMaxDistanceKm('')
    setIsLocationListOpen(false)
    setIsConfirmModalOpen(false)
  }, [
    hasBackendVolunteerProfile,
    hasVolunteerRole,
    isKnownVolunteerUser,
    volunteerProfile,
    volunteerStatus,
  ])

  useEffect(() => {
    if (!isConfirmModalOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isConfirmModalOpen])

  useEffect(() => {
    let isMounted = true

    async function hydrateProfile() {
      if (isMounted) {
        setHasHydratedProfile(false)
        setIsLoadingProfile(true)

        if (!volunteerProfile) {
          setSkills([])
          setHiddenIdentity(false)
        }
      }

      try {
        if (skillsStorageKey && !volunteerProfile) {
          const storedSkills = window.localStorage.getItem(skillsStorageKey)

          if (storedSkills) {
            try {
              const parsedSkills = JSON.parse(storedSkills)

              if (isMounted && Array.isArray(parsedSkills)) {
                setSkills(
                  parsedSkills.filter((value): value is string => typeof value === 'string'),
                )
              }
            } catch {
              window.localStorage.removeItem(skillsStorageKey)
            }
          }
        }

        if (!authUser?.id) {
          return
        }

        const [profileResponse, volunteerResponse] = await Promise.all([
          backend.profile.getMe().catch(() => null),
          backend.volunteers.getMeProfile().catch(() => null),
        ])

        if (!isMounted) {
          return
        }

        if (profileResponse?.success) {
          setHiddenIdentity(readHiddenIdentityFromResponse(profileResponse.data))
        }

        if (volunteerResponse?.success) {
          const currentVolunteerProfile = readCurrentVolunteerPayload(volunteerResponse.data)

          setHasBackendVolunteerProfile(Boolean(currentVolunteerProfile?.profile))
          setVolunteerStatus('volunteer')
          rememberVolunteerUser(authUser.id)

          const volunteerLocation = readVolunteerLocationFromPayload(volunteerResponse.data)
          const volunteerSkills = readVolunteerSkillsFromPayload(volunteerResponse.data)
          const volunteerMaxDistanceKm = readVolunteerMaxDistanceFromPayload(volunteerResponse.data)

          if (!volunteerProfile) {
            if (volunteerLocation) {
              setLocation(volunteerLocation)
            }

            if (volunteerMaxDistanceKm) {
              setMaxDistanceKm(volunteerMaxDistanceKm)
            }

            if (volunteerSkills.length > 0) {
              setSkills(volunteerSkills)
            }
          }
        } else {
          setHasBackendVolunteerProfile(false)
          const shouldKeepVolunteerStatus = Boolean(
            volunteerProfile ||
              volunteerStatusRef.current === 'volunteer' ||
              hasVolunteerRole ||
              isKnownVolunteerUser,
          )

          setVolunteerStatus(shouldKeepVolunteerStatus ? 'volunteer' : 'not-volunteer')

          if (volunteerResponse?.isNotFound && authUser?.id && volunteerProfile && !hasVolunteerRole) {
            deleteVolunteerProfile(authUser.id)
          }
        }

        if (
          volunteerResponse &&
          !volunteerResponse.success &&
          !volunteerResponse.isNotFound &&
          volunteerResponse.message
        ) {
          setSaveError('Nu am reusit sa incarcam setarile profilului.')
        }
      } catch {
        if (isMounted) {
          setSaveError('Nu am reusit sa incarcam setarile profilului.')
        }
      } finally {
        if (isMounted) {
          setHasHydratedProfile(true)
          setIsLoadingProfile(false)
        }
      }
    }

    void hydrateProfile()

    return () => {
      isMounted = false
    }
  }, [
    authUser?.id,
    deleteVolunteerProfile,
    hasVolunteerRole,
    isKnownVolunteerUser,
    rememberVolunteerUser,
    setVolunteerStatus,
    skillsStorageKey,
    volunteerProfile,
  ])

  useEffect(() => {
    if (!skillsStorageKey || !hasHydratedProfile) {
      return
    }

    window.localStorage.setItem(skillsStorageKey, JSON.stringify(skills))
  }, [hasHydratedProfile, skills, skillsStorageKey])

  function updateSkills(nextSkills: string[]) {
    setSkills(nextSkills)
    setSaveError('')
    setSaveMessage('')
  }

  async function handleHiddenIdentityToggle() {
    const previousValue = hiddenIdentity
    const nextValue = !hiddenIdentity

    setHiddenIdentity(nextValue)
    setSaveError('')
    setSaveMessage('')

    if (!authUser?.id || !isExistingVolunteer) {
      return
    }

    try {
      const response = await backend.profile.updateMe({ hiddenIdentity: nextValue })

      if (response.success) {
        if (selectedLocationCoordinates) {
          const parsedDistance = Number(maxDistanceKm.trim())
          upsertVolunteerProfile(authUser.id, {
            location: location.trim(),
            locationCoordinates: selectedLocationCoordinates,
            maxDistanceKm:
              maxDistanceKm.trim() && Number.isFinite(parsedDistance) && parsedDistance > 0
                ? parsedDistance
                : null,
            skills: normalizedSkills,
            hiddenIdentity: nextValue,
          })
        }
        return
      }
    } catch {
      // Network and server errors should also roll back the optimistic toggle.
    }

    setHiddenIdentity(previousValue)
    setSaveError('Nu am reusit sa salvam setarea de confidentialitate.')
  }

  async function handleSaveProfile() {
    const trimmedLocation = location.trim()

    if (!trimmedLocation) {
      setSaveMessage('')
      setSaveError('adauga locatia in care poti ajuta')
      return
    }

    if (!selectedLocationCoordinates) {
      setSaveMessage('')
      setSaveError('alege un oras din lista')
      return
    }

    const parsedDistance = Number(maxDistanceKm.trim())

    if (maxDistanceKm.trim() && (!Number.isFinite(parsedDistance) || parsedDistance <= 0)) {
      setSaveMessage('')
      setSaveError('distanta maxima trebuie sa fie un numar pozitiv')
      return
    }

    if (normalizedSkills.length === 0) {
      setSaveMessage('')
      setSaveError('adauga cel putin o abilitate')
      return
    }

    if (!authUser) {
      setSaveMessage('')
      setSaveError('trebuie sa fii autentificat pentru a salva profilul de voluntar')
      return
    }

    setSaveError('')
    setSaveMessage('')
    setIsSaving(true)

    if (skillsStorageKey) {
      window.localStorage.setItem(skillsStorageKey, JSON.stringify(skills))
    }

    const generalProfilePayload = buildGeneralProfilePayload(authUser.name, hiddenIdentity)
    const volunteerProfilePayload = buildVolunteerProfilePayload({
      availability: true,
      location: selectedLocationCoordinates,
      maxDistanceKm,
      skills: normalizedSkills,
    })

    try {
      const initialProfileResponse = await backend.profile.updateMe(generalProfilePayload)

      const profileResponse =
        !initialProfileResponse.success && initialProfileResponse.isNotFound
          ? await backend.profile.create(generalProfilePayload)
          : initialProfileResponse

      if (!profileResponse.success) {
        setSaveError(profileResponse.message || 'Nu am reusit sa salvam profilul. Incearca din nou.')
        return
      }

      if (!isExistingVolunteer) {
        const becomeVolunteerResponse = await becomeVolunteerMutation.mutateAsync()

        if (!becomeVolunteerResponse.success && !indicatesExistingVolunteer(becomeVolunteerResponse.message)) {
          setSaveError(
            becomeVolunteerResponse.message ||
              'Profilul general a fost salvat, dar nu am putut activa statutul de voluntar.',
          )
          return
        }

        setVolunteerStatus('volunteer')
        rememberVolunteerUser(authUser.id)
      }

      const volunteerProfileResponse = hasBackendVolunteerProfile
        ? await backend.volunteers.updateMeProfile(volunteerProfilePayload)
        : await backend.volunteers.createMeProfile(volunteerProfilePayload)

      const persistedVolunteerProfileResponse =
        !volunteerProfileResponse.success && !hasBackendVolunteerProfile
          ? await backend.volunteers.updateMeProfile(volunteerProfilePayload)
          : volunteerProfileResponse

      if (!persistedVolunteerProfileResponse.success) {
        setHasBackendVolunteerProfile(false)
        setVolunteerStatus('volunteer')
        rememberVolunteerUser(authUser.id)
        setSaveError(
          persistedVolunteerProfileResponse.message ||
            'Statutul de voluntar a fost activat, dar profilul de voluntar nu a putut fi salvat.',
        )
        return
      }

      const volunteerResponse = await backend.volunteers.getMeProfile()

      if (!volunteerResponse.success) {
        setHasBackendVolunteerProfile(false)
        setVolunteerStatus('volunteer')
        rememberVolunteerUser(authUser.id)
        upsertVolunteerProfile(authUser.id, {
          location: trimmedLocation,
          locationCoordinates: selectedLocationCoordinates,
          availability: true,
          maxDistanceKm: volunteerProfilePayload.maxDistanceKm,
          skills: normalizedSkills,
          hiddenIdentity,
        })
        setSaveError(
          volunteerResponse.message ||
            'Profilul a fost salvat, dar backendul nu confirma inca statutul de voluntar.',
        )
        return
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, SAVE_DELAY_MS)
      })

      setHasBackendVolunteerProfile(true)
      setVolunteerStatus('volunteer')
      rememberVolunteerUser(authUser.id)
      upsertVolunteerProfile(authUser.id, {
        location: trimmedLocation,
        locationCoordinates: selectedLocationCoordinates,
        availability: true,
        maxDistanceKm: volunteerProfilePayload.maxDistanceKm,
        skills: normalizedSkills,
        hiddenIdentity,
      })

      setSaveMessage(
        isExistingVolunteer
          ? 'Setarile profilului au fost actualizate.'
          : 'Profilul de voluntar a fost creat.',
      )
    } catch {
      setSaveError('Nu am reusit sa salvam profilul. Incearca din nou.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmOptOut() {
    if (!authUser?.id) {
      return
    }

    setSaveError('')
    setSaveMessage('')
    setIsSaving(true)

    try {
      const response = await backend.volunteers.updateMeProfile({ availability: false })

      if (!response.success) {
        setSaveError(response.message || 'Nu am putut dezactiva disponibilitatea de voluntar.')
        return
      }

      if (volunteerProfile) {
        upsertVolunteerProfile(authUser.id, {
          location: volunteerProfile.location,
          locationCoordinates: volunteerProfile.locationCoordinates,
          availability: false,
          maxDistanceKm: volunteerProfile.maxDistanceKm,
          knownLocations: volunteerProfile.knownLocations,
          skills: volunteerProfile.skills,
          hiddenIdentity: volunteerProfile.hiddenIdentity,
        })
      }

      setSaveMessage('Disponibilitatea de voluntar a fost dezactivata.')
      setIsConfirmModalOpen(false)
    } catch {
      setSaveError('Nu am putut dezactiva disponibilitatea de voluntar.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-brand-cream">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              {pageTitle}
            </h1>
          </div>

          {!isFormVisible ? (
            <div className="space-y-6 px-6 py-8 sm:px-8">
              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-brand-black">Cum functioneaza rolul</h2>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-brand-gray-text sm:grid-cols-3">
                  <p className="rounded-[20px] border border-brand-gray bg-white p-4">
                    Alegi zona in care poti interveni sau ajuta online.
                  </p>
                  <p className="rounded-[20px] border border-brand-gray bg-white p-4">
                    Adaugi abilitatile relevante pentru cererile de ajutor.
                  </p>
                  <p className="rounded-[20px] border border-brand-gray bg-white p-4">
                    Poti reveni oricand sa editezi profilul sau sa renunti.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-[20px] bg-brand-black px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                  onClick={() => setIsFormVisible(true)}
                >
                  Incepe acum
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-6 py-8 sm:px-8">
              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-brand-black">Locatie</h2>

                <div className="relative mt-5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-brand-gray bg-white px-4 py-3 text-left text-sm text-brand-black outline-none transition hover:border-brand-purple focus:border-brand-purple"
                    aria-haspopup="listbox"
                    aria-expanded={isLocationListOpen}
                    aria-label="Locatie voluntar"
                    onClick={() => setIsLocationListOpen((currentValue) => !currentValue)}
                  >
                    <span className={location ? 'text-brand-black' : 'text-brand-gray-text'}>
                      {location || 'Alege orasul'}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 text-brand-gray-text transition-transform ${
                        isLocationListOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isLocationListOpen ? (
                    <div
                      role="listbox"
                      aria-label="Orase disponibile"
                      className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-[18px] border border-brand-gray bg-white p-1 shadow-sm"
                    >
                      {ROMANIA_CITY_NAMES.map((city) => (
                        <button
                          key={city}
                          type="button"
                          role="option"
                          aria-selected={location === city}
                          className={`block w-full rounded-[14px] px-3 py-2 text-left text-sm transition ${
                            location === city
                              ? 'bg-brand-purple text-white'
                              : 'text-brand-black hover:bg-brand-cream'
                          }`}
                          onClick={() => {
                            setLocation(city)
                            setSaveError('')
                            setIsLocationListOpen(false)
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  <label
                    className="mb-2 block text-sm font-semibold text-brand-black"
                    htmlFor="max-distance-km"
                  >
                    Distanta maxima (km)
                  </label>
                  <input
                    id="max-distance-km"
                    min="0"
                    step="0.1"
                    type="number"
                    value={maxDistanceKm}
                    onChange={(event) => {
                      setMaxDistanceKm(event.target.value)
                      setSaveError('')
                      setSaveMessage('')
                    }}
                    className="w-full rounded-[18px] border border-brand-gray bg-white px-4 py-3 text-sm text-brand-black outline-none transition focus:border-brand-purple"
                    placeholder="Ex: 15"
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-brand-black">Abilitati</h2>

                <SkillTagSelector
                  suggestions={COMMON_SKILL_SUGGESTIONS}
                  value={skills}
                  onChange={updateSkills}
                  inputPlaceholder="Ex: traducere, transport, organizare"
                  className="mt-5"
                />
              </div>

              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-brand-black">Ascunde identitatea</h2>
                  </div>

                  <button
                    type="button"
                    className={`profile-switch ${hiddenIdentity ? 'profile-switch-active' : ''}`}
                    onClick={() => {
                      void handleHiddenIdentityToggle()
                    }}
                    aria-pressed={hiddenIdentity}
                    aria-label="Ascunde identitatea"
                    disabled={isLoadingProfile}
                  >
                    <span />
                  </button>
                </div>

                <p className="mt-4 text-sm font-semibold text-brand-gray-text">
                  {hiddenIdentity ? 'Mod confidential activ' : 'Identitatea este vizibila'}
                </p>
              </div>

              {saveError ? (
                <p className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {saveError}
                </p>
              ) : null}

              {saveMessage ? (
                <p className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {saveMessage}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex min-w-[220px] items-center justify-center rounded-[20px] bg-brand-black px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => {
                    void handleSaveProfile()
                  }}
                  disabled={isSaving || isLoadingProfile}
                >
                  {isSaving ? 'Se salveaza profilul...' : 'Salveaza Profilul'}
                </button>
              </div>

              {isExistingVolunteer ? (
                <div className="border-t border-brand-gray pt-6">
                  <div className="rounded-[24px] border border-red-200 bg-red-50/50 p-5">
                    <h2 className="text-base font-bold text-red-700">Renuntare voluntariat</h2>
                    <p className="mt-2 text-sm leading-6 text-red-700/80">
                      Nu vei mai primi alerte pentru cereri potrivite.
                    </p>
                    <button
                      type="button"
                      className="mt-4 rounded-[18px] border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      onClick={() => setIsConfirmModalOpen(true)}
                    >
                      Renunta la statutul de voluntar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {isConfirmModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="volunteer-opt-out-title"
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl"
          >
            <h2 id="volunteer-opt-out-title" className="text-xl font-bold text-brand-black">
              Esti sigur ca vrei sa stergi profilul tau de voluntar?
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-gray-text">
              Nu vei mai primi notificari pentru cererile de ajutor din zona ta.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-[18px] border border-brand-gray bg-white px-5 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-cream"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Anuleaza
              </button>
              <button
                type="button"
                className="rounded-[18px] bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={handleConfirmOptOut}
              >
                Da, renunt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .profile-switch {
          width: 56px;
          height: 32px;
          border: none;
          border-radius: 999px;
          background: #d1d5db;
          padding: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }

        .profile-switch span {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #ffffff;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 6px rgba(17, 24, 39, 0.18);
        }

        .profile-switch.profile-switch-active {
          background: #7c3aed;
        }

        .profile-switch.profile-switch-active span {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  )
}

export default ProfilePage
