import { ArrowRight, CircleUserRound, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

export function UserProfilePage() {
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const volunteerProfile = useVolunteerProfileStore((state) =>
    authUser?.id ? state.profilesByUserId[authUser.id] : undefined,
  )
  const hasVolunteerAccount = Boolean(volunteerProfile)

  return (
    <div className="bg-brand-cream">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[36px] border border-brand-gray bg-white shadow-sm">
          <div className="border-b border-brand-gray bg-brand-purple-light px-6 py-7 sm:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              Profilul meu
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-gray-text sm:text-base">
              Aici găsești datele de bază ale contului tău și acces rapid către setările de
              voluntar.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-purple-light p-3 text-brand-purple-dark">
                    <CircleUserRound className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-brand-black">Date cont</h2>
                    <p className="text-sm text-brand-gray-text">
                      Informațiile principale asociate contului tău.
                    </p>
                  </div>
                </div>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold text-brand-gray-text">Nume</dt>
                    <dd className="mt-1 text-base text-brand-black">
                      {authUser?.name?.trim() || 'Nespecificat'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-brand-gray-text">Email</dt>
                    <dd className="mt-1 break-all text-base text-brand-black">
                      {authUser?.email?.trim() || 'Nespecificat'}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-[28px] border border-brand-gray bg-brand-cream/70 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-purple-light p-3 text-brand-purple-dark">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-brand-black">Status voluntar</h2>
                    <p className="text-sm text-brand-gray-text">
                      Configurează sau actualizează profilul de voluntar separat de pagina de cont.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[22px] border border-brand-gray bg-white p-5">
                  <p className="text-sm font-semibold text-brand-gray-text">Stare curentă</p>
                  <p className="mt-2 text-base text-brand-black">
                    {hasVolunteerAccount
                      ? 'Ai un profil de voluntar activ.'
                      : 'Nu ai configurat încă profilul de voluntar.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 rounded-[20px] bg-brand-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  onClick={() => navigate('/devino-voluntar')}
                >
                  {hasVolunteerAccount ? 'Deschide setările de voluntar' : 'Devino voluntar'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default UserProfilePage
