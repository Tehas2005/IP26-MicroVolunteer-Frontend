import { useState } from 'react'

export function ProfilePage() {
  const [hiddenIdentity, setHiddenIdentity] = useState(false)

  return (
    <div className="bg-brand-cream">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              Setări identitate profil
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-gray-text sm:text-base">
              Alege dacă persoanele pe care le ajuți îți văd numele real sau doar username-ul.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <div className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-brand-black">Ascunde identitatea</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-gray-text">
                    Când activezi această opțiune, ceilalți utilizatori nu îți vor vedea numele
                    real în interacțiunile din platformă.
                  </p>
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

              <div className="mt-5 rounded-[20px] border border-brand-gray bg-white px-4 py-4">
                <p className="text-sm font-semibold text-brand-black">
                  {hiddenIdentity ? 'Mod confidențial activ' : 'Identitatea este vizibilă'}
                </p>
                <p className="mt-2 text-sm leading-6 text-brand-gray-text">
                  {hiddenIdentity
                    ? 'Cei pe care îi ajuți vor vedea doar username-ul tău.'
                    : 'Persoanele cu care interacționezi vor vedea numele tău complet.'}
                </p>
              </div>
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
