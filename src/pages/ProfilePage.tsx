import { backend } from '@/lib/backend'
import { addSkillToList, readHiddenIdentityFromResponse } from '@/pages/profile/utils'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useMemo, useState } from 'react'

const SAVE_DELAY_MS = 1200
const SKILLS_STORAGE_KEY_PREFIX = 'mvcr-profile-skills'

const SKILL_SUGGESTIONS = ['traducere', 'transport', 'insotire', 'cumparaturi', 'suport emotional']

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user)
  const [hiddenIdentity, setHiddenIdentity] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [hasHydratedProfile, setHasHydratedProfile] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')

  const skillsStorageKey = useMemo(() => {
    if (!authUser?.id) {
      return null
    }

    return `${SKILLS_STORAGE_KEY_PREFIX}:${authUser.id}`
  }, [authUser?.id])

  useEffect(() => {
    let isMounted = true

    async function hydrateProfile() {
      if (isMounted) {
        setHasHydratedProfile(false)
        setIsLoadingProfile(true)
        setSkills([])
        setHiddenIdentity(false)
      }

      try {
        if (skillsStorageKey) {
          const storedSkills = window.localStorage.getItem(skillsStorageKey)

          if (storedSkills) {
            try {
              const parsedSkills = JSON.parse(storedSkills)

              if (isMounted && Array.isArray(parsedSkills)) {
                setSkills(parsedSkills.filter((value): value is string => typeof value === 'string'))
              }
            } catch {
              window.localStorage.removeItem(skillsStorageKey)
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
  }, [authUser?.id, skillsStorageKey])

  useEffect(() => {
    if (!skillsStorageKey || !hasHydratedProfile) {
      return
    }

    window.localStorage.setItem(skillsStorageKey, JSON.stringify(skills))
  }, [hasHydratedProfile, skills, skillsStorageKey])

  function addSkill(rawSkill: string) {
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

  function removeSkill(skillToRemove: string) {
    setSkills((currentSkills) =>
      currentSkills.filter((existingSkill) => existingSkill !== skillToRemove),
    )
    setSaveError('')
    setSaveMessage('')
  }

  async function handleHiddenIdentityToggle() {
    const nextValue = !hiddenIdentity

    setHiddenIdentity(nextValue)
    setSaveError('')
    setSaveMessage('')

    const response = await backend.profile.updateMe({ hiddenIdentity: nextValue })

    if (response.success) {
      return
    }

    if (response.isNotFound) {
      const createResponse = await backend.profile.create({ hiddenIdentity: nextValue })

      if (createResponse.success) {
        return
      }
    }

    setHiddenIdentity((currentValue) => !currentValue)
    setSaveError('Nu am reusit sa salvam setarea de confidentialitate.')
  }

  async function handleSaveProfile() {
    if (skills.length === 0) {
      setSaveMessage('')
      setSaveError('adauga cel putin o abilitate')
      return
    }

    setSaveError('')
    setSaveMessage('')
    setIsSaving(true)

    if (skillsStorageKey) {
      window.localStorage.setItem(skillsStorageKey, JSON.stringify(skills))
    }

    const response = await backend.profile.updateMe({ hiddenIdentity })

    if (!response.success && response.isNotFound) {
      const createResponse = await backend.profile.create({ hiddenIdentity })

      if (!createResponse.success) {
        setIsSaving(false)
        setSaveError('Nu am reusit sa salvam profilul. Incearca din nou.')
        return
      }
    } else if (!response.success) {
      setIsSaving(false)
      setSaveError('Nu am reusit sa salvam profilul. Incearca din nou.')
      return
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, SAVE_DELAY_MS)
    })

    setIsSaving(false)
    setSaveMessage('Setarile profilului au fost salvate.')
  }

  return (
    <div className="bg-brand-cream">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              Setari profil voluntar
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-gray-text sm:text-base">
              Adauga abilitatile tale principale si alege daca vrei sa iti ascunzi
              identitatea in interactiunile din platforma.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-brand-black">Abilitati</h2>
              <p className="mt-2 text-sm leading-6 text-brand-gray-text">
                Introdu o abilitate relevanta si transforma-o intr-un tag vizibil in profil.
              </p>

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
                  <p className="mt-2 text-sm leading-6 text-brand-gray-text">
                    Cand activezi aceasta optiune, ceilalti utilizatori nu iti vor vedea
                    numele real in interactiunile din platforma.
                  </p>
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

              <div className="mt-5 rounded-[20px] border border-brand-gray bg-white px-4 py-4">
                <p className="text-sm font-semibold text-brand-black">
                  {hiddenIdentity ? 'Mod confidential activ' : 'Identitatea este vizibila'}
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-gray-text">
                  {hiddenIdentity
                    ? 'Cei pe care ii ajuti vor vedea doar username-ul tau.'
                    : 'Persoanele cu care interactionezi vor vedea numele tau complet.'}
                </p>
              </div>
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
          </div>
        </div>
      </section>

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
