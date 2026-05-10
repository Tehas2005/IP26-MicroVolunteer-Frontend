import React, { useState, useEffect, useMemo, type FormEvent } from 'react'
import { backend } from '@/lib/backend'
import { useAuthStore } from '@/store/authStore'

const CITIES = [
    'Alba Iulia', 'Alexandria', 'Arad', 'Bacau', 'Baia Mare', 'Bistrita',
    'Botosani', 'Brasov', 'Braila', 'Bucuresti', 'Buzau', 'Calarasi',
    'Cluj-Napoca', 'Constanta', 'Craiova', 'Deva', 'Drobeta-Turnu Severin',
    'Focsani', 'Galati', 'Giurgiu', 'Iasi', 'Miercurea-Ciuc', 'Oradea',
    'Piatra-Neamt', 'Pitesti', 'Ploiesti', 'Ramnicu Valcea', 'Resita',
    'Satu Mare', 'Sfantu Gheorghe', 'Sibiu', 'Slatina', 'Slobozia',
    'Suceava', 'Targu Jiu', 'Targu Mures', 'Targoviste', 'Timisoara',
    'Tulcea', 'Vaslui', 'Zalau',
]

const SKILL_SUGGESTIONS = ['traducere', 'transport', 'insotire', 'cumparaturi', 'suport emotional']
const SKILLS_STORAGE_KEY_PREFIX = 'mvcr-profile-skills'

interface LocationEntry {
    city: string
    address: string
}

export default function VolunteerProfilePage() {
    const authUser = useAuthStore((state) => state.user)

    // --- State Part A (Locație) ---
    const [maxDistanceKm, setMaxDistanceKm] = useState<string>('')
    const [currentLocation, setCurrentLocation] = useState<string>('')
    const [selectedCity, setSelectedCity] = useState<string>('')
    const [specificAddress, setSpecificAddress] = useState<string>('')
    const [knownLocations, setKnownLocations] = useState<LocationEntry[]>([])

    // --- State Part B (Skills & Privacy) ---
    const [skills, setSkills] = useState<string[]>([])
    const [skillInput, setSkillInput] = useState('')
    const [hiddenIdentity, setHiddenIdentity] = useState(false)

    // --- UI & Sync State ---
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState('')
    const [saveMessage, setSaveMessage] = useState('')
    const [isLoadingProfile, setIsLoadingProfile] = useState(true)

    const skillsStorageKey = useMemo(() =>
            authUser?.id ? `${SKILLS_STORAGE_KEY_PREFIX}:${authUser.id}` : null,
        [authUser?.id])

    // --- Hydration (Încărcare date) ---
    useEffect(() => {
        async function hydrateProfile() {
            if (skillsStorageKey) {
                const stored = localStorage.getItem(skillsStorageKey)
                if (stored) {
                    try { setSkills(JSON.parse(stored)) } catch { localStorage.removeItem(skillsStorageKey) }
                }
            }

            if (authUser?.id) {
                const response = await backend.profile.getByUserId(authUser.id)
                if (response.success && response.data) {
                    const data = response.data as any
                    setHiddenIdentity(!!data.hiddenIdentity)
                    setMaxDistanceKm(data.maxDistanceKm?.toString() || '')
                    setCurrentLocation(data.currentLocation || '')
                }
            }
            setIsLoadingProfile(false)
        }
        hydrateProfile()
    }, [authUser?.id, skillsStorageKey])

    // --- Logică Part A ---
    const handleAddLocation = () => {
        if (selectedCity && specificAddress.trim()) {
            setKnownLocations([...knownLocations, { city: selectedCity, address: specificAddress.trim() }])
            setSpecificAddress('')
        }
    }

    // --- Logică Part B ---
    const addSkill = (skill: string) => {
        const normalized = skill.trim()
        if (normalized && !skills.includes(normalized)) {
            setSkills([...skills, normalized])
            setSkillInput('')
            setSaveError('')
        }
    }

    // --- Final Save (Merge A + B) ---
    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault()
        if (skills.length === 0) {
            setSaveError('adauga cel putin o abilitate') // [cite: 46]
            return
        }

        setIsSaving(true)
        setSaveError('')
        setSaveMessage('')

        const payload = {
            maxDistanceKm: parseFloat(maxDistanceKm),
            currentLocation,
            knownLocations: knownLocations.map(l => `${l.city}, ${l.address}`),
            skills,
            hiddenIdentity
        }

        const response = await backend.profile.updateMe(payload)

        if (!response.success && response.isNotFound) {
            await backend.profile.create(payload)
        }

        if (skillsStorageKey) {
            localStorage.setItem(skillsStorageKey, JSON.stringify(skills))
        }

        setTimeout(() => {
            setIsSaving(false)
            setSaveMessage('Profilul tău a fost salvat cu succes!')
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-brand-cream pb-12">
            <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">

                    {/* Header */}
                    <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
                        <h1 className="text-3xl font-bold tracking-tight text-brand-black">Setări Profil Voluntar</h1>
                        <p className="mt-2 text-sm text-brand-gray-text">Configurează zona de acoperire și abilitățile tale.</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-8 px-6 py-8 sm:px-8">

                        {/* Secțiunea 1: Locație (Part A) */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-brand-black border-b pb-2">1. Zonă și Distanță</h2>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-bold text-brand-black mb-2">
                                        Distanța maximă (km) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={maxDistanceKm}
                                        onChange={(e) => setMaxDistanceKm(e.target.value)}
                                        className="w-full rounded-[18px] border border-brand-gray px-4 py-3 text-sm focus:border-brand-purple outline-none"
                                        placeholder="Ex: 15"
                                    />
                                    {parseFloat(maxDistanceKm) < 0 && <p className="text-red-500 text-xs mt-1">Distanța trebuie să fie un număr pozitiv</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-brand-black mb-2">Locația curentă *</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentLocation}
                                        onChange={(e) => setCurrentLocation(e.target.value)}
                                        className="w-full rounded-[18px] border border-brand-gray px-4 py-3 text-sm focus:border-brand-purple outline-none"
                                        placeholder="Oraș, Stradă..."
                                    />
                                </div>
                            </div>

                            {/* Zone Cunoscute */}
                            <div className="rounded-[24px] bg-brand-cream/40 p-5 border border-brand-gray">
                                <label className="block text-sm font-bold mb-3">Adaugă zone cunoscute</label>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="rounded-[15px] border border-brand-gray bg-white px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="">Oraș</option>
                                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        value={specificAddress}
                                        onChange={(e) => setSpecificAddress(e.target.value)}
                                        placeholder="Stradă/Zonă"
                                        className="flex-1 rounded-[15px] border border-brand-gray px-4 py-2 text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddLocation}
                                        className="rounded-[15px] bg-brand-black px-4 py-2 text-sm font-bold text-white"
                                    >
                                        Adaugă
                                    </button>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {knownLocations.map((loc) => (
                                        <span key={`${loc.city}-${loc.address}`} className="bg-brand-purple-light px-3 py-1 rounded-full text-xs font-bold border border-brand-purple/20">
                      {loc.city} | {loc.address}
                    </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Secțiunea 2: Abilități (Part B) */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-brand-black border-b pb-2">2. Abilități și Experiență</h2>
                            <div className="rounded-[24px] border border-brand-gray bg-brand-cream/40 p-5">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                                        placeholder="Adaugă abilitate (ex: transport)"
                                        className="flex-1 rounded-[15px] border border-brand-gray px-4 py-2 text-sm outline-none"
                                    />
                                    <button type="button" onClick={() => addSkill(skillInput)} className="bg-brand-black text-white px-4 py-2 rounded-[15px] text-sm font-bold">Adaugă</button>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {skills.map(s => (
                                        <span key={s} className="bg-white border border-brand-purple px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {s} <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))}>×</button>
                    </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-2 flex-wrap">
                                    {SKILL_SUGGESTIONS.map(s => (
                                        <button key={s} type="button" onClick={() => addSkill(s)} className="text-xs bg-white border border-brand-gray px-2 py-1 rounded-full hover:border-brand-purple transition">
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Secțiunea 3: Confidențialitate (Part B) */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-brand-black border-b pb-2">3. Confidențialitate</h2>
                            <div className="flex items-center justify-between rounded-[24px] border border-brand-gray bg-brand-cream/40 p-5">
                                <div>
                                    <p className="font-bold text-brand-black text-sm">Ascunde identitatea</p>
                                    {hiddenIdentity && (
                                        <p className="text-xs text-brand-gray-text mt-1 transition-opacity">
                                            Cei pe care îi ajuți vor vedea doar username-ul tău.
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHiddenIdentity(!hiddenIdentity)}
                                    className={`w-14 h-8 rounded-full transition-colors duration-200 p-1 ${hiddenIdentity ? 'bg-brand-purple' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-200 ${hiddenIdentity ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Mesaje și Buton Save */}
                        <div className="pt-6 border-t border-brand-gray">
                            {saveError && <p className="text-red-600 text-sm font-bold mb-4">{saveError}</p>}
                            {saveMessage && <p className="text-emerald-700 text-sm font-bold mb-4">{saveMessage}</p>}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full sm:w-auto min-w-[220px] bg-brand-black text-white font-bold py-4 px-8 rounded-[20px] hover:opacity-90 disabled:opacity-50 transition"
                            >
                                {isSaving ? 'Se salvează...' : 'Salvează Profilul'}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    )
}