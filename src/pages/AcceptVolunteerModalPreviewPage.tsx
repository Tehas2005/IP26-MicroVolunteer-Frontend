import { useState } from 'react'

import AcceptVolunteerModal from '@/components/modals/AcceptVolunteerModal'

const PRESET_DELAY_MS = 900

export default function AcceptVolunteerModalPreviewPage() {
  const [isOpen, setIsOpen] = useState(true)
  const [volunteerName, setVolunteerName] = useState('Andrei Popescu')
  const [averageRating, setAverageRating] = useState('4.8')
  const [lastDecision, setLastDecision] = useState('Nicio actiune inca.')

  async function simulateDecision(decision: 'accept' | 'decline') {
    await new Promise((resolve) => {
      window.setTimeout(resolve, PRESET_DELAY_MS)
    })

    setLastDecision(
      decision === 'accept'
        ? 'Ai simulat acceptarea ajutorului.'
        : 'Ai simulat refuzul ajutorului.',
    )
    setIsOpen(false)
  }

  return (
    <section className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-purple">
            Dev Preview
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            FE-008 Modal acceptare voluntar
          </h1>
          <p className="mt-3 text-sm leading-6 text-brand-gray-text sm:text-base">
            Aici poti testa modalul izolat. Schimbi numele si scorul, apoi il deschizi
            din nou ca sa verifici loading-ul si afisarea rating-ului.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-[28px] border border-brand-gray bg-brand-cream/40 p-5 sm:p-6">
            <div>
              <label
                className="mb-2 block text-sm font-bold text-brand-black"
                htmlFor="preview-volunteer-name"
              >
                Nume / username voluntar
              </label>
              <input
                id="preview-volunteer-name"
                type="text"
                value={volunteerName}
                onChange={(event) => setVolunteerName(event.target.value)}
                className="w-full rounded-[16px] border border-brand-gray bg-white px-4 py-3 text-sm text-brand-black outline-none transition focus:border-brand-purple"
                placeholder="Ex: Andrei Popescu"
              />
              <p className="mt-2 text-xs text-brand-gray-text">
                Lasa gol pentru a testa fallback-ul de anonimitate.
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-bold text-brand-black"
                htmlFor="preview-average-rating"
              >
                Average rating
              </label>
              <input
                id="preview-average-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={averageRating}
                onChange={(event) => setAverageRating(event.target.value)}
                className="w-full rounded-[16px] border border-brand-gray bg-white px-4 py-3 text-sm text-brand-black outline-none transition focus:border-brand-purple"
                placeholder="4.8"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true)
                  setLastDecision('Modal redeschis pentru test.')
                }}
                className="rounded-[18px] bg-brand-purple px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                Deschide modalul
              </button>
              <button
                type="button"
                onClick={() => {
                  setVolunteerName('')
                  setAverageRating('0')
                  setIsOpen(true)
                  setLastDecision('Preview resetat pentru fallback anonim.')
                }}
                className="rounded-[18px] border border-brand-gray bg-white px-5 py-3 text-sm font-semibold text-brand-black transition hover:bg-brand-cream"
              >
                Test anonim
              </button>
            </div>
          </div>

          <aside className="rounded-[28px] border border-brand-gray bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-brand-black">Ce sa verifici</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-brand-gray-text">
              <li>Scorul trebuie sa fie cel mai vizibil element din modal.</li>
              <li>La click pe oricare buton, ambele butoane devin inactive.</li>
              <li>Overlay-ul intunecat trebuie sa acopere fundalul complet.</li>
              <li>Pe ecrane mici, modalul ramane centrat si usor de citit.</li>
            </ul>

            <div className="mt-6 rounded-[20px] bg-brand-cream px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">
                Ultima simulare
              </p>
              <p className="mt-2 text-sm font-medium text-brand-black">{lastDecision}</p>
            </div>
          </aside>
        </div>
      </div>

      <AcceptVolunteerModal
        averageRating={Number.parseFloat(averageRating)}
        isOpen={isOpen}
        onAccept={() => simulateDecision('accept')}
        onDecline={() => simulateDecision('decline')}
        volunteerName={volunteerName}
      />
    </section>
  )
}
