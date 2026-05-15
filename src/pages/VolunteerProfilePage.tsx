import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { backend } from '@/lib/backend'
import { useAuthStore } from '@/store/authStore'

import {
  addKnownLocation,
  addSkillToList,
  readHiddenIdentityFromResponse,
  removeKnownLocation,
  type KnownLocationEntry,
  validateMaxDistanceKm,
} from './volunteerProfileUtils'

const CITIES = [
  'Alba Iulia',
  'Alexandria',
  'Arad',
  'Bacau',
  'Baia Mare',
  'Bistrita',
  'Botosani',
  'Brasov',
  'Braila',
  'Bucuresti',
  'Buzau',
  'Calarasi',
  'Cluj-Napoca',
  'Constanta',
  'Craiova',
  'Deva',
  'Drobeta-Turnu Severin',
  'Focsani',
  'Galati',
  'Giurgiu',
  'Iasi',
  'Miercurea-Ciuc',
  'Oradea',
  'Piatra-Neamt',
  'Pitesti',
  'Ploiesti',
  'Ramnicu Valcea',
  'Resita',
  'Satu Mare',
  'Sfantu Gheorghe',
  'Sibiu',
  'Slatina',
  'Slobozia',
  'Suceava',
  'Targu Jiu',
  'Targu Mures',
  'Targoviste',
  'Timisoara',
  'Tulcea',
  'Vaslui',
  'Zalau',
]

const SKILL_SUGGESTIONS = [
  'traducere',
  'transport',
  'insotire',
  'cumparaturi',
  'suport emotional',
]

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

export default function VolunteerProfilePage() {
  const authUser = useAuthStore((state) => state.user)

  const [maxDistanceKm, setMaxDistanceKm] = useState(EMPTY_DRAFT.maxDistanceKm)
  const [currentLocation, setCurrentLocation] = useState(EMPTY_DRAFT.currentLocation)
  const [selectedCity, setSelectedCity] = useState(EMPTY_DRAFT.selectedCity)
  const [specificAddress, setSpecificAddress] = useState(EMPTY_DRAFT.specificAddress)
  const [knownLocations, setKnownLocations] = useState<KnownLocationEntry[]>(EMPTY_DRAFT.knownLocations)
  const [skills, setSkills] = useState<string[]>(EMPTY_DRAFT.skills)
  const [skillInput, setSkillInput] = useState(EMPTY_DRAFT.skillInput)
  const [hiddenIdentity, setHiddenIdentity] = useState(EMPTY_DRAFT.hiddenIdentity)
  const [distanceTouched, setDistanceTouched] = useState(false)
  const [hasHydratedProfile, setHasHydratedProfile] = useState(false)
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

  useEffect(() => {
    let isMounted = true

    async function hydrateProfile() {
      if (isMounted) {
        setHasHydratedProfile(false)
        setIsLoadingProfile(true)
        setSaveError('')
        setSaveMessage('')
      }

      try {
        if (draftKey) {
          const storedDraft = window.localStorage.getItem(draftKey)

          if (storedDraft) {
            const parsedDraft = JSON.parse(storedDraft) as Partial<ProfileDraft>

            if (isMounted) {
              setMaxDistanceKm(parsedDraft.maxDistanceKm ?? EMPTY_DRAFT.maxDistanceKm)
              setCurrentLocation(parsedDraft.currentLocation ?? EMPTY_DRAFT.currentLocation)
              setSelectedCity(parsedDraft.selectedCity ?? EMPTY_DRAFT.selectedCity)
              setSpecificAddress(parsedDraft.specificAddress ?? EMPTY_DRAFT.specificAddress)
              setKnownLocations(
                Array.isArray(parsedDraft.knownLocations)
                  ? parsedDraft.knownLocations.filter(
                      (entry): entry is KnownLocationEntry =>
                        typeof entry?.city === 'string' && typeof entry?.address === 'string',
                    )
                  : EMPTY_DRAFT.knownLocations,
              )
              setSkills(
                Array.isArray(parsedDraft.skills)
                  ? parsedDraft.skills.filter((entry): entry is string => typeof entry === 'string')
                  : EMPTY_DRAFT.skills,
              )
              setSkillInput(parsedDraft.skillInput ?? EMPTY_DRAFT.skillInput)
              setHiddenIdentity(Boolean(parsedDraft.hiddenIdentity))
            }
          }
        }

        if (!authUser?.id) {
          return
        }

        const profileResponse = await backend.profile.getByUserId(authUser.id)

        if (!isMounted) {
          return
        }

        if (profileResponse.success) {
          setHiddenIdentity(readHiddenIdentityFromResponse(profileResponse.data))
        } else if (!profileResponse.isNotFound && profileResponse.message) {
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
  }, [authUser?.id, draftKey])

  useEffect(() => {
    if (!draftKey || !hasHydratedProfile) {
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
    hasHydratedProfile,
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

    setMaxDistanceKm(EMPTY_DRAFT.maxDistanceKm)
    setCurrentLocation(EMPTY_DRAFT.currentLocation)
    setSelectedCity(EMPTY_DRAFT.selectedCity)
    setSpecificAddress(EMPTY_DRAFT.specificAddress)
    setKnownLocations(EMPTY_DRAFT.knownLocations)
    setSkills(EMPTY_DRAFT.skills)
    setSkillInput(EMPTY_DRAFT.skillInput)
    setHiddenIdentity(EMPTY_DRAFT.hiddenIdentity)
    setDistanceTouched(false)
    setSaveError('')
    setSaveMessage('')

    if (draftKey) {
      window.localStorage.removeItem(draftKey)
    }
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

    setIsSaving(true)

    try {
      const response = await backend.profile.updateMe({ hiddenIdentity })

      if (!response.success) {
        setSaveError(
          'Datele locale au fost pastrate, dar setarea de confidentialitate nu a putut fi sincronizata.',
        )
        return
      }

      setSaveMessage('Setarile profilului au fost salvate.')
    } catch {
      setSaveError(
        'Datele locale au fost pastrate, dar setarea de confidentialitate nu a putut fi sincronizata.',
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
                    required
                    type="text"
                    value={currentLocation}
                    onChange={(event) => setCurrentLocation(event.target.value)}
                    className="w-full rounded-[18px] border border-brand-gray px-4 py-3 text-sm outline-none transition focus:border-brand-purple"
                    placeholder="Oras, strada sau punct de reper"
                  />
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
                              removeKnownLocation(
                                knownLocations,
                                location.city,
                                location.address,
                              ),
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
                  Adauga abilitatile tale principale. Lista este pastrata local pe utilizator in
                  aceasta iteratie.
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
