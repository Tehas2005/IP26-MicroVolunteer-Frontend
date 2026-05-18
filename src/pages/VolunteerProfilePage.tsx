import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { backend } from '@/lib/backend'
import {
  ROMANIA_CITY_COORDINATES,
  ROMANIA_CITY_NAMES,
  type TaskLocationPayload,
} from '@/lib/romania-city-coordinates'
import type {
  VolunteerProfileCreatePayloadType,
  VolunteerLocationPointType,
  VolunteerOwnProfileType,
} from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

import {
  addKnownLocation,
  addSkillToList,
  readHiddenIdentityFromResponse,
  removeKnownLocation,
  type KnownLocationEntry,
  validateMaxDistanceKm,
} from './volunteerProfileUtils'

const CITIES = ROMANIA_CITY_NAMES

const SKILL_SUGGESTIONS = ['traducere', 'transport', 'insotire', 'cumparaturi', 'suport emotional']

const PROFILE_DRAFT_KEY_PREFIX = 'mvcr-volunteer-profile-draft'

type ProfileDraft = {
  currentLocation: string
  hiddenIdentity: boolean
  knownLocations: KnownLocationEntry[]
  maxDistanceKm: string
  selectedCity: string
  skillInput: string
  skills: string[]
  specificAddress: string
}

const EMPTY_DRAFT: ProfileDraft = {
  currentLocation: '',
  hiddenIdentity: false,
  knownLocations: [],
  maxDistanceKm: '',
  selectedCity: '',
  skillInput: '',
  skills: [],
  specificAddress: '',
}

const LOCATION_MATCH_EPSILON = 0.000001

function sanitizeKnownLocations(value: unknown): KnownLocationEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (entry): entry is KnownLocationEntry =>
      typeof entry?.city === 'string' && typeof entry?.address === 'string',
  )
}

function sanitizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

function sanitizeDraft(rawDraft: Partial<ProfileDraft> | null): ProfileDraft {
  return {
    currentLocation: rawDraft?.currentLocation ?? EMPTY_DRAFT.currentLocation,
    hiddenIdentity: Boolean(rawDraft?.hiddenIdentity),
    knownLocations: sanitizeKnownLocations(rawDraft?.knownLocations),
    maxDistanceKm: rawDraft?.maxDistanceKm ?? EMPTY_DRAFT.maxDistanceKm,
    selectedCity: rawDraft?.selectedCity ?? EMPTY_DRAFT.selectedCity,
    skillInput: rawDraft?.skillInput ?? EMPTY_DRAFT.skillInput,
    skills: sanitizeSkills(rawDraft?.skills),
    specificAddress: rawDraft?.specificAddress ?? EMPTY_DRAFT.specificAddress,
  }
}

function resolveVolunteerLocationPoint(location: string): VolunteerLocationPointType | null {
  const normalizedLocation = location.trim()

  if (!normalizedLocation) {
    return null
  }

  return ROMANIA_CITY_COORDINATES[normalizedLocation] ?? null
}

function resolveRomanianCityByPoint(
  point: VolunteerLocationPointType | TaskLocationPayload | null | undefined,
): string {
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

function extractVolunteerProfile(payload: unknown): VolunteerOwnProfileType['profile'] | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('profile' in payload) {
    return (payload as VolunteerOwnProfileType).profile ?? null
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    const nestedData = payload.data as VolunteerOwnProfileType
    return nestedData.profile ?? null
  }

  return null
}

function buildDraftFromVolunteerProfile(
  profile: VolunteerOwnProfileType['profile'],
  hiddenIdentity: boolean,
): ProfileDraft {
  const knownLocations =
    profile?.knownLocations
      ?.map((entry) => ({
        city: entry.city?.trim() || resolveRomanianCityByPoint(entry.location ?? null),
        address: entry.addressText?.trim() || '',
      }))
      ?.filter((entry) => entry.city && entry.address) ?? []

  return {
    currentLocation: resolveRomanianCityByPoint(profile?.currentLocation ?? null),
    hiddenIdentity,
    knownLocations,
    maxDistanceKm: typeof profile?.maxDistanceKm === 'number' ? String(profile.maxDistanceKm) : '',
    selectedCity: '',
    skillInput: '',
    skills: sanitizeSkills(profile?.skills),
    specificAddress: '',
  }
}

function buildVolunteerProfilePayload(draft: ProfileDraft): VolunteerProfileCreatePayloadType {
  const currentLocationPoint = resolveVolunteerLocationPoint(draft.currentLocation)

  if (!currentLocationPoint) {
    throw new Error('Invalid volunteer current location')
  }

  const knownLocations = draft.knownLocations
    .map((location) => {
      const coordinates = resolveVolunteerLocationPoint(location.city)

      if (!coordinates) {
        return null
      }

      return {
        city: location.city,
        addressText: location.address,
        location: coordinates,
      }
    })
    .filter(
      (
        location,
      ): location is { city: string; addressText: string; location: VolunteerLocationPointType } =>
        location !== null,
    )

  return {
    currentLocation: currentLocationPoint,
    knownLocations,
    maxDistanceKm: Number(draft.maxDistanceKm),
    skills: draft.skills,
    availability: true,
  }
}

export default function VolunteerProfilePage() {
  const authUser = useAuthStore((state) => state.user)
  const upsertVolunteerProfile = useVolunteerProfileStore((state) => state.upsertVolunteerProfile)

  const [maxDistanceKm, setMaxDistanceKm] = useState(EMPTY_DRAFT.maxDistanceKm)
  const [currentLocation, setCurrentLocation] = useState(EMPTY_DRAFT.currentLocation)
  const [selectedCity, setSelectedCity] = useState(EMPTY_DRAFT.selectedCity)
  const [specificAddress, setSpecificAddress] = useState(EMPTY_DRAFT.specificAddress)
  const [knownLocations, setKnownLocations] = useState<KnownLocationEntry[]>(
    EMPTY_DRAFT.knownLocations,
  )
  const [skills, setSkills] = useState<string[]>(EMPTY_DRAFT.skills)
  const [skillInput, setSkillInput] = useState(EMPTY_DRAFT.skillInput)
  const [hiddenIdentity, setHiddenIdentity] = useState(EMPTY_DRAFT.hiddenIdentity)
  const [lastSavedDraft, setLastSavedDraft] = useState(EMPTY_DRAFT)
  const [hasRemoteVolunteerProfile, setHasRemoteVolunteerProfile] = useState(false)
  const [distanceTouched, setDistanceTouched] = useState(false)
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const draftKey = useMemo(() => {
    if (!authUser?.id) {
      return null
    }

    return `${PROFILE_DRAFT_KEY_PREFIX}:${authUser.id}`
  }, [authUser?.id])

  const distanceError = distanceTouched ? validateMaxDistanceKm(maxDistanceKm) : ''

  function applyDraft(draft: ProfileDraft) {
    setMaxDistanceKm(draft.maxDistanceKm)
    setCurrentLocation(draft.currentLocation)
    setSelectedCity(draft.selectedCity)
    setSpecificAddress(draft.specificAddress)
    setKnownLocations(draft.knownLocations)
    setSkills(draft.skills)
    setSkillInput(draft.skillInput)
    setHiddenIdentity(draft.hiddenIdentity)
  }

  useEffect(() => {
    let isMounted = true

    async function hydrateProfile() {
      let localDraft: ProfileDraft | null = null

      if (isMounted) {
        setHasHydratedDraft(false)
        setIsLoadingProfile(true)
        setSaveError('')
        setSaveMessage('')
      }

      try {
        if (draftKey) {
          const storedDraft = window.localStorage.getItem(draftKey)

          if (storedDraft) {
            try {
              localDraft = sanitizeDraft(JSON.parse(storedDraft) as Partial<ProfileDraft>)

              if (isMounted) {
                applyDraft(localDraft)
              }
            } catch {
              window.localStorage.removeItem(draftKey)
            }
          }
        }

        if (isMounted) {
          setHasHydratedDraft(true)
        }

        if (!authUser?.id) {
          if (isMounted) {
            setLastSavedDraft(localDraft ?? EMPTY_DRAFT)
            setHasRemoteVolunteerProfile(false)
          }
          return
        }

        const [privacyResponse, volunteerProfileResponse] = await Promise.all([
          backend.profile.getByUserId(authUser.id).catch(() => null),
          backend.volunteerProfiles.getMe().catch(() => null),
        ])

        if (!isMounted) {
          return
        }

        const remoteHiddenIdentity =
          privacyResponse?.success && privacyResponse.data
            ? readHiddenIdentityFromResponse(privacyResponse.data)
            : null

        const remoteVolunteerProfile =
          volunteerProfileResponse?.success && volunteerProfileResponse.data
            ? extractVolunteerProfile(volunteerProfileResponse.data)
            : null

        const remoteDraft =
          remoteVolunteerProfile !== null
            ? buildDraftFromVolunteerProfile(
                remoteVolunteerProfile,
                remoteHiddenIdentity ?? EMPTY_DRAFT.hiddenIdentity,
              )
            : null

        const nextDraft =
          localDraft ??
          (remoteDraft
            ? {
                ...remoteDraft,
                hiddenIdentity: remoteHiddenIdentity ?? remoteDraft.hiddenIdentity,
              }
            : {
                ...EMPTY_DRAFT,
                hiddenIdentity: remoteHiddenIdentity ?? EMPTY_DRAFT.hiddenIdentity,
              })

        if (!localDraft) {
          applyDraft(nextDraft)
        } else if (remoteHiddenIdentity !== null) {
          setHiddenIdentity(localDraft.hiddenIdentity)
        }

        const remoteCurrentLocation = remoteDraft?.currentLocation.trim() ?? ''
        const remoteLocationCoordinates = resolveVolunteerLocationPoint(remoteCurrentLocation)

        if (authUser?.id && remoteDraft && remoteCurrentLocation && remoteLocationCoordinates) {
          upsertVolunteerProfile(authUser.id, {
            hiddenIdentity: remoteDraft.hiddenIdentity,
            location: remoteCurrentLocation,
            locationCoordinates: remoteLocationCoordinates,
            skills: remoteDraft.skills,
          })
        }

        setLastSavedDraft(nextDraft)
        setHasRemoteVolunteerProfile(Boolean(remoteVolunteerProfile))

        if (
          privacyResponse &&
          !privacyResponse.success &&
          !privacyResponse.isNotFound &&
          privacyResponse.message
        ) {
          setSaveError('Nu am reusit sa incarcam setarile profilului.')
        }
      } catch {
        if (isMounted) {
          setSaveError('Nu am reusit sa incarcam setarile profilului.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    void hydrateProfile()

    return () => {
      isMounted = false
    }
  }, [authUser?.id, draftKey, upsertVolunteerProfile])

  useEffect(() => {
    if (!draftKey || !hasHydratedDraft) {
      return
    }

    const draft: ProfileDraft = {
      currentLocation,
      hiddenIdentity,
      knownLocations,
      maxDistanceKm,
      selectedCity,
      skillInput,
      skills,
      specificAddress,
    }

    window.localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [
    currentLocation,
    draftKey,
    hasHydratedDraft,
    hiddenIdentity,
    knownLocations,
    maxDistanceKm,
    selectedCity,
    skillInput,
    skills,
    specificAddress,
  ])

  function handleAddLocation() {
    const nextKnownLocations = addKnownLocation(knownLocations, selectedCity, specificAddress)

    if (nextKnownLocations === knownLocations) {
      return
    }

    setKnownLocations(nextKnownLocations)
    setSelectedCity('')
    setSpecificAddress('')
    setSaveError('')
    setSaveMessage('')
  }

  function handleAddSkill(rawSkill: string) {
    const nextSkills = addSkillToList(skills, rawSkill)

    if (nextSkills === skills && !rawSkill.trim()) {
      return
    }

    if (nextSkills === skills) {
      setSkillInput('')
      return
    }

    setSkills(nextSkills)
    setSkillInput('')
    setSaveError('')
    setSaveMessage('')
  }

  function handleReset() {
    if (!window.confirm('Sigur vrei să resetezi modificările nesalvate?')) {
      return
    }

    applyDraft(lastSavedDraft)
    setDistanceTouched(false)
    setSaveError('')
    setSaveMessage('')

    if (draftKey) {
      window.localStorage.setItem(draftKey, JSON.stringify(lastSavedDraft))
    }
  }

  function syncVolunteerProfileStore(draft: ProfileDraft) {
    const locationCoordinates = resolveVolunteerLocationPoint(draft.currentLocation)

    if (!authUser?.id || !draft.currentLocation || !locationCoordinates) {
      return
    }

    upsertVolunteerProfile(authUser.id, {
      hiddenIdentity: draft.hiddenIdentity,
      location: draft.currentLocation,
      locationCoordinates,
      skills: draft.skills,
    })
  }

  async function saveVolunteerProfile(payload: VolunteerProfileCreatePayloadType) {
    async function ensureVolunteerRecord() {
      const response = await backend.users.becomeVolunteer()

      if (response.success || /already.*volunteer/i.test(response.message ?? '')) {
        return true
      }

      return false
    }

    if (!hasRemoteVolunteerProfile) {
      const hasVolunteerRecord = await ensureVolunteerRecord()
      const createResponse = await backend.volunteerProfiles.createMe(payload)

      if (createResponse.success) {
        return createResponse
      }

      if (createResponse.isClientError && hasVolunteerRecord) {
        return backend.volunteerProfiles.updateMe(payload)
      }

      return createResponse
    }

    const primaryResponse = await backend.volunteerProfiles.updateMe(payload)

    if (primaryResponse.success) {
      return primaryResponse
    }

    if (primaryResponse.isNotFound && hasRemoteVolunteerProfile) {
      const hasVolunteerRecord = await ensureVolunteerRecord()

      if (!hasVolunteerRecord) {
        return primaryResponse
      }

      return backend.volunteerProfiles.createMe(payload)
    }

    if (primaryResponse.isClientError && !hasRemoteVolunteerProfile) {
      return backend.volunteerProfiles.updateMe(payload)
    }

    return primaryResponse
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDistanceTouched(true)
    setSaveError('')
    setSaveMessage('')

    const nextDistanceError = validateMaxDistanceKm(maxDistanceKm)
    if (nextDistanceError) {
      setSaveError(nextDistanceError)
      return
    }

    if (!currentLocation.trim()) {
      setSaveError('Completeaza locatia curenta.')
      return
    }

    if (!resolveVolunteerLocationPoint(currentLocation)) {
      setSaveError('Alege un oras valid pentru locatia curenta.')
      return
    }

    setIsSaving(true)

    const currentDraft: ProfileDraft = {
      currentLocation,
      hiddenIdentity,
      knownLocations,
      maxDistanceKm,
      selectedCity: '',
      skillInput,
      skills,
      specificAddress: '',
    }

    try {
      const volunteerProfilePayload = buildVolunteerProfilePayload(currentDraft)
      const [privacyResponse, volunteerProfileResponse] = await Promise.all([
        backend.profile.updateMe({ hiddenIdentity }).catch(() => null),
        saveVolunteerProfile(volunteerProfilePayload).catch(() => null),
      ])

      const hasSyncedVolunteerProfile = Boolean(volunteerProfileResponse?.success)
      const hasSyncedPrivacy = Boolean(privacyResponse?.success)
      const nextHiddenIdentity = hasSyncedPrivacy
        ? currentDraft.hiddenIdentity
        : lastSavedDraft.hiddenIdentity
      const persistedDraft = {
        ...currentDraft,
        hiddenIdentity: nextHiddenIdentity,
      }

      if (!hasSyncedPrivacy && hiddenIdentity !== nextHiddenIdentity) {
        setHiddenIdentity(nextHiddenIdentity)
      }

      if (volunteerProfileResponse?.success) {
        setHasRemoteVolunteerProfile(true)
      }

      if (hasSyncedVolunteerProfile && hasSyncedPrivacy) {
        syncVolunteerProfileStore(persistedDraft)
        setLastSavedDraft(persistedDraft)
        setSaveMessage('Setarile profilului au fost salvate si sincronizate.')
        return
      }

      if (hasSyncedVolunteerProfile) {
        syncVolunteerProfileStore(persistedDraft)
        setLastSavedDraft(persistedDraft)
        setSaveMessage(
          'Datele profilului de voluntar au fost salvate. Confidentialitatea nu a putut fi sincronizata.',
        )
        return
      }

      if (
        volunteerProfileResponse?.isNotFound ||
        (volunteerProfileResponse &&
          !volunteerProfileResponse.success &&
          volunteerProfileResponse.status === 404)
      ) {
        syncVolunteerProfileStore(persistedDraft)
        setLastSavedDraft(persistedDraft)
        setSaveMessage(
          'Datele au fost salvate local. Sincronizarea cu backend-ul pentru profilul de voluntar nu este inca disponibila.',
        )
        return
      }

      setSaveError(
        volunteerProfileResponse?.message ||
          'Datele locale au fost pastrate, dar profilul de voluntar nu a putut fi sincronizat.',
      )
    } catch {
      setSaveError(
        'Datele locale au fost pastrate, dar profilul de voluntar nu a putut fi sincronizat.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-12">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-brand-black">
              Setari profil voluntar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-gray-text">
              Configureaza zona de acoperire, abilitatile tale principale si optiunile de
              confidentialitate.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-8 px-6 py-8 sm:px-8">
            <div className="space-y-6">
              <h2 className="border-b border-brand-gray pb-2 text-xl font-bold text-brand-black">
                1. Zona si distanta
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-brand-black"
                    htmlFor="max-distance-km"
                  >
                    Distanta maxima (km) *
                  </label>
                  <input
                    id="max-distance-km"
                    min="0"
                    required
                    step="0.1"
                    type="number"
                    value={maxDistanceKm}
                    onBlur={() => setDistanceTouched(true)}
                    onChange={(event) => setMaxDistanceKm(event.target.value)}
                    className="w-full rounded-[18px] border border-brand-gray px-4 py-3 text-sm outline-none transition focus:border-brand-purple"
                    placeholder="Ex: 15"
                  />
                  {distanceError ? (
                    <p className="mt-2 text-sm font-semibold text-red-600">{distanceError}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-brand-black"
                    htmlFor="current-location"
                  >
                    Locatia curenta *
                  </label>
                  <input
                    id="current-location"
                    list="romania-cities"
                    required
                    type="text"
                    value={currentLocation}
                    onChange={(event) => setCurrentLocation(event.target.value)}
                    className="w-full rounded-[18px] border border-brand-gray px-4 py-3 text-sm outline-none transition focus:border-brand-purple"
                    placeholder="Alege orasul din lista"
                  />
                  <datalist id="romania-cities">
                    {CITIES.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  <p className="mt-2 text-xs text-brand-gray-text">
                    Pentru sincronizare cu backend-ul, alege un oras din lista.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-brand-gray bg-brand-cream/40 p-5">
                <label className="mb-3 block text-sm font-bold text-brand-black">
                  Locatii cunoscute
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    className="rounded-[15px] border border-brand-gray bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-purple"
                    aria-label="Selecteaza orasul pentru locatia cunoscuta"
                  >
                    <option value="">Alege orasul</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={specificAddress}
                    onChange={(event) => setSpecificAddress(event.target.value)}
                    placeholder="Strada sau zona cunoscuta"
                    className="flex-1 rounded-[15px] border border-brand-gray px-4 py-2 text-sm outline-none transition focus:border-brand-purple"
                    aria-label="Completeaza adresa pentru locatia cunoscuta"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="rounded-[15px] bg-brand-black px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Adauga
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {knownLocations.length > 0 ? (
                    knownLocations.map((location) => (
                      <span
                        key={`${location.city}-${location.address}`}
                        className="inline-flex items-center gap-2 rounded-full border border-brand-purple/20 bg-brand-purple-light px-3 py-1 text-xs font-bold text-brand-black"
                      >
                        {location.city} | {location.address}
                        <button
                          type="button"
                          onClick={() =>
                            setKnownLocations(
                              removeKnownLocation(knownLocations, location.city, location.address),
                            )
                          }
                          className="text-sm leading-none transition hover:text-red-500"
                          aria-label={`Sterge locatia ${location.city} ${location.address}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-brand-gray-text">
                      Adauga locatiile pe care le cunosti pentru a le vedea aici instant.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="border-b border-brand-gray pb-2 text-xl font-bold text-brand-black">
                2. Abilitati si experienta
              </h2>

              <div className="rounded-[24px] border border-brand-gray bg-brand-cream/40 p-5">
                <p className="text-sm leading-6 text-brand-gray-text">
                  Adauga abilitatile tale principale. Lista este sincronizata cu profilul de
                  voluntar atunci cand endpoint-ul backend este disponibil.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddSkill(skillInput)
                      }
                    }}
                    placeholder="Adauga abilitate"
                    className="flex-1 rounded-[15px] border border-brand-gray px-4 py-2 text-sm outline-none transition focus:border-brand-purple"
                    aria-label="Adauga abilitate"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="rounded-[15px] bg-brand-black px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Adauga
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="rounded-full border border-brand-purple/30 bg-white px-3 py-1 text-xs font-semibold text-brand-black transition hover:bg-brand-purple-light"
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-full border border-brand-purple bg-white px-3 py-1 text-sm text-brand-black"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setSkills((currentSkills) =>
                              currentSkills.filter((entry) => entry !== skill),
                            )
                          }
                          className="text-sm leading-none transition hover:text-red-500"
                          aria-label={`Sterge abilitatea ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-brand-gray-text">
                      Nu ai adaugat inca nicio abilitate.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="border-b border-brand-gray pb-2 text-xl font-bold text-brand-black">
                3. Confidentialitate
              </h2>

              <div className="flex items-center justify-between rounded-[24px] border border-brand-gray bg-brand-cream/40 p-5">
                <div>
                  <p className="text-sm font-bold text-brand-black">Ascunde identitatea</p>
                  <p className="mt-1 text-xs text-brand-gray-text">
                    Setarea de confidentialitate este sincronizata cu backend-ul.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHiddenIdentity((currentValue) => !currentValue)}
                  className={`h-8 w-14 rounded-full p-1 transition-colors duration-200 ${
                    hiddenIdentity ? 'bg-brand-purple' : 'bg-gray-300'
                  }`}
                  aria-label="Comuta ascunderea identitatii"
                  disabled={isLoadingProfile}
                >
                  <div
                    className={`h-6 w-6 rounded-full bg-white transition-transform duration-200 ${
                      hiddenIdentity ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-brand-gray pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className="min-w-[220px] rounded-[20px] bg-brand-black px-8 py-4 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? 'Se salveaza...' : 'Salveaza profilul'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-[20px] border border-brand-gray px-8 py-4 font-bold text-brand-gray-text transition hover:bg-gray-50"
              >
                Reseteaza modificarile
              </button>
            </div>

            {saveError ? <p className="text-sm font-bold text-red-600">{saveError}</p> : null}
            {saveMessage ? (
              <p className="text-sm font-bold text-emerald-700">{saveMessage}</p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  )
}
