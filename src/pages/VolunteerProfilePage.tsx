import React, { useState, type FormEvent, type KeyboardEvent } from 'react'

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

const profileStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .profile-page {
    color: #111827;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .profile-form-container {
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    padding: 40px 16px;
    min-height: calc(100vh - 148px);
  }

  .profile-card {
    background-color: #ffffff;
    border-radius: 24px;
    padding: 40px;
    max-width: 680px;
    margin: 0 auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  }

  .profile-header-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .profile-header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 32px 0;
  }

  .profile-field-group {
    margin-bottom: 28px;
  }

  .profile-field-label {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    display: block;
  }

  .profile-required-asterisk {
    color: #ef4444;
  }

  .profile-text-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    background-color: #ffffff;
  }

  .profile-text-input:focus {
    border-color: #7c3aed;
  }

  .profile-text-input.profile-error-input {
    border-color: #ef4444;
  }

  .profile-text-input::placeholder {
    color: #9ca3af;
  }

  /* Specific pentru select ca sa arate la fel ca inputurile lui */
  .profile-select-input {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 16px;
    padding-right: 40px;
  }

  .profile-section-card {
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    background: #fbfbfd;
    padding: 18px;
  }

  .profile-section-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .profile-section-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .profile-section-copy {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
  }

  .profile-inline-field {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

  .profile-inline-field .profile-text-input {
    flex: 1;
  }

  .profile-secondary-btn {
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background: #ffffff;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
    padding: 0 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .profile-secondary-btn:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .profile-secondary-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .profile-helper-text {
    color: #6b7280;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 500;
    line-height: 1.5;
  }

  .profile-error-text {
    color: #ef4444;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 600;
  }

  .profile-selected-locations {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
    min-height: 34px;
    align-items: center;
  }

  .profile-selected-location {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    background: #ede9fe;
    color: #5b21b6;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
  }

  .profile-selected-location-address {
    color: #111827;
    font-weight: 600;
  }

  .profile-selected-location button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 12px;
    font-weight: 800;
  }

  .profile-success-box {
    background-color: #dcfce7;
    color: #166534;
    padding: 16px;
    border-radius: 12px;
    margin-top: 24px;
    text-align: center;
    font-weight: 700;
    border: 1px solid #bbf7d0;
  }

  .profile-primary-submit-btn {
    background-color: #1a1a1a;
    color: #ffffff;
    border-radius: 12px;
    padding: 16px;
    border: none;
    width: 100%;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
    position: relative;
    overflow: hidden;
    background-size: 200% auto;
  }

  .profile-primary-submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .profile-primary-submit-btn.profile-submitting {
    background-image: linear-gradient(90deg, #1a1a1a 0%, #7c3aed 50%, #1a1a1a 100%);
    animation: profile-pulse-gradient 1.5s linear infinite;
    pointer-events: none;
    color: #fff;
  }

  @keyframes profile-pulse-gradient {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  @media (max-width: 768px) {
    .profile-form-container {
      padding: 24px 16px;
    }

    .profile-card {
      padding: 28px 20px;
      border-radius: 20px;
    }

    .profile-inline-field {
      flex-direction: column;
    }
  }
`

interface LocationEntry {
    city: string
    address: string
}

export default function VolunteerProfilePage() {
    const [maxDistanceKm, setMaxDistanceKm] = useState<string>('')
    const [distanceError, setDistanceError] = useState<string>('')
    const [currentLocation, setCurrentLocation] = useState<string>('')

    const [selectedCity, setSelectedCity] = useState<string>('')
    const [specificAddress, setSpecificAddress] = useState<string>('')
    const [knownLocations, setKnownLocations] = useState<LocationEntry[]>([])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setMaxDistanceKm(val)

        if (val !== '' && parseFloat(val) < 0) {
            setDistanceError('Distanța trebuie să fie un număr pozitiv')
        } else {
            setDistanceError('')
        }
    }

    const handleAddLocation = () => {
        if (selectedCity && specificAddress.trim() !== '') {
            setKnownLocations([...knownLocations, { city: selectedCity, address: specificAddress.trim() }])
            setSpecificAddress('')
        }
    }

    const handleAddressKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            handleAddLocation()
        }
    }

    const handleRemoveLocation = (indexToRemove: number) => {
        setKnownLocations(knownLocations.filter((_, idx) => idx !== indexToRemove))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSuccessMessage('')

        // Adăugăm adresa dacă a rămas ceva nescris în input și dă direct submit
        if (selectedCity && specificAddress.trim() !== '') {
            handleAddLocation();
        }

        setIsSubmitting(true)

        const payload = {
            maxDistanceKm: parseFloat(maxDistanceKm),
            currentLocation,
            knownLocations
        }

        try {
            // Mock submit (la fel ca în ask-for-help)
            await new Promise((resolve) => setTimeout(resolve, 1500))
            console.log('JSON pregatit (Mock):', JSON.stringify(payload))
            setSuccessMessage('Profilul tău a fost salvat cu succes!')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="profile-page bg-brand-cream">
            <style>{profileStyles}</style>

            <div className="profile-form-container">
                <main className="profile-card">
                    <h1 className="profile-header-title">Setări Locație Voluntar</h1>
                    <p className="profile-header-subtitle">
                        Configurează zona ta de acoperire pentru a primi cereri relevante.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* 1. Distanta maxima */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">
                                Distanța maximă de deplasare (km) <span className="profile-required-asterisk">*</span>
                            </label>
                            <input
                                type="number"
                                className={`profile-text-input ${distanceError ? 'profile-error-input' : ''}`}
                                placeholder="Ex: 15"
                                value={maxDistanceKm}
                                onChange={handleDistanceChange}
                                required
                                min="0"
                            />
                            {distanceError && <div className="profile-error-text">{distanceError}</div>}
                        </div>

                        {/* 2. Locatia curenta */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">
                                Locația curentă <span className="profile-required-asterisk">*</span>
                            </label>
                            <input
                                type="text"
                                className="profile-text-input"
                                placeholder="Scrie orașul și strada unde te afli..."
                                value={currentLocation}
                                onChange={(event) => setCurrentLocation(event.target.value)}
                                required
                            />
                        </div>

                        {/* 3. Locatii cunoscute (oras + adresa) */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">Locații unde poți ajuta (Opțional)</label>
                            <div className="profile-section-card">
                                <div className="profile-section-title-row">
                                    <div>
                                        <h2 className="profile-section-title">Adaugă zone cunoscute</h2>
                                        <p className="profile-section-copy">
                                            Te vom notifica direct dacă apare o cerere într-una din aceste zone,
                                            chiar dacă depășește distanța ta curentă.
                                        </p>
                                    </div>
                                </div>

                                <div className="profile-inline-field">
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="profile-text-input profile-select-input sm:max-w-[200px]"
                                    >
                                        <option value="" disabled>Alege orașul</option>
                                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>

                                    <input
                                        type="text"
                                        className="profile-text-input"
                                        placeholder="Adaugă strada sau zona..."
                                        value={specificAddress}
                                        onChange={(event) => setSpecificAddress(event.target.value)}
                                        onKeyDown={handleAddressKeyDown}
                                    />

                                    <button
                                        type="button"
                                        className="profile-secondary-btn"
                                        onClick={handleAddLocation}
                                        disabled={!selectedCity || !specificAddress.trim()}
                                    >
                                        Adaugă
                                    </button>
                                </div>

                                <div className="profile-selected-locations">
                                    {knownLocations.length === 0 ? (
                                        <p className="profile-helper-text">
                                            Selectează un oraș și scrie o adresă pentru a adăuga.
                                        </p>
                                    ) : (
                                        knownLocations.map((loc, index) => (
                                            <span key={index} className="profile-selected-location">
                        {loc.city} <span className="text-brand-purple/50">|</span> <span className="profile-selected-location-address">{loc.address}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveLocation(index)}
                        >
                          x
                        </button>
                      </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Buton Submit */}
                        <button
                            type="submit"
                            className={`profile-primary-submit-btn ${isSubmitting ? 'profile-submitting' : ''}`}
                            disabled={isSubmitting || !!distanceError}
                        >
                            {isSubmitting ? 'Se salvează...' : 'Salvează Profilul'}
                        </button>

                        {successMessage && <div className="profile-success-box">{successMessage}</div>}
                    </form>
                </main>
            </div>
        </section>
    )
}