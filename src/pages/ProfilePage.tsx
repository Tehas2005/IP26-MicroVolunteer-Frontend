import { useEffect, useMemo, useState } from 'react'

import {
  ROMANIA_CITY_COORDINATES,
  ROMANIA_CITY_NAMES,
  type TaskLocationPayload,
} from '@/lib/romania-city-coordinates'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

const SAVE_DELAY_MS = 1200

const SKILL_SUGGESTIONS = ['traducere', 'transport', 'insotire', 'cumparaturi', 'suport emotional']

function resolveVolunteerLocation(location: string): TaskLocationPayload | null {
  const normalizedLocation = location.trim()

  if (!normalizedLocation) {
    return null
  }

  return ROMANIA_CITY_COORDINATES[normalizedLocation] ?? null
}

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user)
  const volunteerProfile = useVolunteerProfileStore((state) =>
    authUser?.id ? state.profilesByUserId[authUser.id] : undefined,
  )
  const upsertVolunteerProfile = useVolunteerProfileStore((state) => state.upsertVolunteerProfile)
  const deleteVolunteerProfile = useVolunteerProfileStore((state) => state.deleteVolunteerProfile)

  const [isFormVisible, setIsFormVisible] = useState(Boolean(volunteerProfile))
  const [location, setLocation] = useState(volunteerProfile?.location ?? '')
  const [hiddenIdentity, setHiddenIdentity] = useState(volunteerProfile?.hiddenIdentity ?? false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(volunteerProfile?.skills ?? [])
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLocationListOpen, setIsLocationListOpen] = useState(false)

  const isExistingVolunteer = Boolean(volunteerProfile)
  const pageTitle = isExistingVolunteer ? 'Setari profil voluntar' : 'Devino voluntar'
  const selectedLocationCoordinates = resolveVolunteerLocation(location)

  useEffect(() => {
    if (volunteerProfile) {
      setIsFormVisible(true)
      setLocation(volunteerProfile.location)
      setHiddenIdentity(volunteerProfile.hiddenIdentity)
      setSkills(volunteerProfile.skills)
      return
    }

    setIsFormVisible(false)
    setLocation('')
    setHiddenIdentity(false)
    setSkills([])
    setSkillInput('')
  }, [volunteerProfile])

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

  const normalizedSkills = useMemo(
    () => skills.map((skill) => skill.trim()).filter(Boolean),
    [skills],
  )

  function addSkill(rawSkill: string) {
    const normalizedSkill = rawSkill.trim()

    if (!normalizedSkill) {
      return
    }

    const alreadyExists = skills.some(
      (existingSkill) => existingSkill.toLowerCase() === normalizedSkill.toLowerCase(),
    )

    if (alreadyExists) {
      setSkillInput('')
      return
    }

    setSkills((currentSkills) => [...currentSkills, normalizedSkill])
    setSkillInput('')
    setSaveError('')
  }

  function removeSkill(skillToRemove: string) {
    setSkills((currentSkills) =>
      currentSkills.filter((existingSkill) => existingSkill !== skillToRemove),
    )
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

    await new Promise((resolve) => {
      window.setTimeout(resolve, SAVE_DELAY_MS)
    })

    upsertVolunteerProfile(authUser.id, {
      location: trimmedLocation,
      locationCoordinates: selectedLocationCoordinates,
      skills: normalizedSkills,
      hiddenIdentity,
    })

    setIsSaving(false)
    setSaveMessage(
      isExistingVolunteer
        ? 'Setarile profilului au fost actualizate.'
        : 'Profilul de voluntar a fost creat.',
    )
  }

  function handleConfirmOptOut() {
    if (!authUser) {
      return
    }

    deleteVolunteerProfile(authUser.id)
    setIsConfirmModalOpen(false)
    setIsLocationListOpen(false)
    setSaveError('')
    setSaveMessage('')
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
                    <span aria-hidden="true" className="text-xs font-bold text-brand-gray-text">
                      v
                    </span>
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
              </div>

              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-brand-black">Abilitati</h2>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addSkill(skillInput)
                      }
                    }}
                    placeholder="Ex: traducere, transport, organizare"
                    className="w-full rounded-[18px] border border-brand-gray bg-white px-4 py-3 text-sm text-brand-black outline-none transition focus:border-brand-purple"
                    aria-label="Adauga abilitate"
                  />

                  <button
                    type="button"
                    className="rounded-[18px] bg-brand-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    onClick={() => addSkill(skillInput)}
                  >
                    Adauga
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple-light/70 px-3 py-2 text-sm font-medium text-brand-black"
                      >
                        {skill}
                        <button
                          type="button"
                          className="rounded-full text-brand-gray-text transition hover:text-brand-black"
                          onClick={() => removeSkill(skill)}
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

                <div className="mt-5 flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-full border border-brand-gray bg-white px-3 py-1.5 text-xs font-medium text-brand-gray-text transition hover:border-brand-purple hover:text-brand-black"
                      onClick={() => addSkill(suggestion)}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-brand-black">Ascunde identitatea</h2>
                  </div>

                  <button
                    type="button"
                    className={`profile-switch ${hiddenIdentity ? 'profile-switch-active' : ''}`}
                    onClick={() => setHiddenIdentity((currentValue) => !currentValue)}
                    aria-pressed={hiddenIdentity}
                    aria-label="Ascunde identitatea"
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
                  disabled={isSaving}
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
