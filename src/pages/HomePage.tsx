import { useNavigate } from 'react-router-dom'

import AnimatedCharacters from '@/components/shared/AnimatedCharacters'
import {
  type LiveRequestCardData,
} from '@/components/shared/LiveRequestCard'
import LiveRequestsSection from '@/components/shared/LiveRequestsSection'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function HomePage() {
  const navigate = useNavigate()
  const { isGuest } = useAuthStore()

  const myRequests: LiveRequestCardData[] = [
    {
      id: 'my-translation',
      title: 'Traducere rapidă pentru o programare medicală',
      category: 'MESSAGES_ONLY',
      urgencyLevel: 'MEDIUM',
      anonymousMode: true,
      username: 'help_now',
      name: 'Ana Popescu',
    },
    {
      id: 'my-form-support',
      title: 'Sprijin pentru completarea unui formular local',
      category: 'FACETOFACE',
      urgencyLevel: 'LOW',
      anonymousMode: false,
      username: 'maria.support',
      name: 'Maria Enache',
    },
  ]

  const volunteerFeedRequests: LiveRequestCardData[] = [
    {
      id: 'volunteer-medicine',
      title: 'Ridicare medicamente pentru o persoană vulnerabilă',
      category: 'FACETOFACE',
      urgencyLevel: 'CRITICAL',
      anonymousMode: false,
      username: 'maria.safe',
      name: 'Maria Enache',
    },
    {
      id: 'volunteer-guidance',
      title: 'Însoțire locală pentru orientare într-o zonă nouă',
      category: 'FACETOFACE',
      urgencyLevel: 'LOW',
      anonymousMode: false,
      username: 'geo_voluntar',
    },
    {
      id: 'volunteer-check-in',
      title: 'Verificare rapidă prin mesaje pentru o persoană izolată',
      category: 'MESSAGES_ONLY',
      urgencyLevel: 'MEDIUM',
      anonymousMode: true,
      username: 'safe_contact',
      name: 'Ioana Marin',
    },
  ]

  return (
    <div className="bg-brand-cream">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-[52px] border border-brand-gray/80 bg-brand-purple-light">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:px-10 lg:py-14">
            <div className="flex flex-col justify-center text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-brand-black sm:text-5xl">
                Bine ai venit la Micro-Volunteer Crisis Router
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-brand-gray-text sm:text-xl">
                Conectăm oamenii cu voluntari locali în momente de criză, într-un spațiu clar,
                calm și ușor de folosit.
              </p>

              <div className="mt-8 flex justify-center lg:justify-start">
                <Button
                  className="min-w-[220px] text-base"
                  onClick={() => navigate('/cere-ajutor')}
                  size="lg"
                  variant="primary"
                >
                  Cere Ajutor Acum
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[380px]">
                <div className="h-[220px] sm:h-[250px] lg:hidden">
                  <AnimatedCharacters compact mood="login" />
                </div>
                <div className="hidden min-h-[340px] lg:block">
                  <AnimatedCharacters mood="login" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <div className="rounded-[36px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-brand-gray pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red/35" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-red" />
              </span>
              <h2 className="text-2xl font-bold text-brand-black sm:text-3xl">Cereri Live</h2>
            </div>

            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate('/cere-ajutor')}
              variant="auth"
            >
              Cere Ajutor
            </Button>
          </div>

          <LiveRequestsSection
            isGuest={isGuest}
            myRequests={myRequests}
            volunteerRequests={volunteerFeedRequests}
          />
        </div>
      </section>
    </div>
  )
}

export default HomePage
