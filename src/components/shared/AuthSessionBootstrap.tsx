import { type ReactNode, useEffect, useRef } from 'react'

import { authClient } from '@/main'
import { backend } from '@/lib/backend'
import type { ProfileType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

interface AuthSessionBootstrapProps {
  children: ReactNode
}

function resolveAccountStatus(profile: ProfileType | null | undefined) {
  const rawStatus =
    typeof profile?.accountStatus === 'string'
      ? profile.accountStatus
      : typeof profile?.status === 'string'
        ? profile.status
        : ''

  const normalizedStatus = rawStatus.trim().toUpperCase()

  return normalizedStatus === 'BLOCKED' ? 'blocked' : 'active'
}

function readSessionUserRole(user: unknown) {
  if (!user || typeof user !== 'object') {
    return ''
  }

  const role = (user as Record<string, unknown>).role
  return typeof role === 'string' ? role.trim().toLowerCase() : ''
}

async function detectVolunteerAccess() {
  const response = await backend.offers.listMine({
    page: 1,
    pageSize: 1,
  })

  return response.success
}

export function AuthSessionBootstrap({ children }: AuthSessionBootstrapProps) {
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession)
  const setAuthSession = useAuthStore((state) => state.setAuthSession)
  const setAccountStatus = useAuthStore((state) => state.setAccountStatus)
  const setVolunteerStatus = useAuthStore((state) => state.setVolunteerStatus)
  const rememberVolunteerUser = useAuthStore((state) => state.rememberVolunteerUser)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const setSessionStatus = useAuthStore((state) => state.setSessionStatus)
  const knownVolunteerUserIds = useAuthStore((state) => state.knownVolunteerUserIds)
  const volunteerProfilesByUserId = useVolunteerProfileStore((state) => state.profilesByUserId)

  // Refs so the async syncSession can read current values without triggering re-runs
  const volunteerProfilesByUserIdRef = useRef(volunteerProfilesByUserId)
  volunteerProfilesByUserIdRef.current = volunteerProfilesByUserId
  const knownVolunteerUserIdsRef = useRef(knownVolunteerUserIds)
  knownVolunteerUserIdsRef.current = knownVolunteerUserIds

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      setSessionStatus('loading')

      try {
        const response = await authClient.getSession()

        if (!isMounted) {
          return
        }

        if (response.data) {
          const currentUserId = response.data.user.id
          const sessionUserRole = readSessionUserRole(response.data.user)
          const profileResponse = await backend.profile.getMe()

          if (!isMounted) {
            return
          }

          setAuthSession({
            user: {
              id: currentUserId,
              name: response.data.user.name,
              email: response.data.user.email,
              role: sessionUserRole || null,
            },
          })
          setVolunteerStatus('unknown')

          if (profileResponse.isForbidden) {
            setAccountStatus('blocked')
            return
          }

          setAccountStatus(resolveAccountStatus(profileResponse.data))

          const volunteerResponse = await backend.volunteers.getMeProfile()

          if (!isMounted) {
            return
          }

          const hasLocalVolunteerProfile = Boolean(volunteerProfilesByUserIdRef.current[currentUserId])
          const hasKnownVolunteerStatus = Boolean(knownVolunteerUserIdsRef.current[currentUserId])
          const isVolunteerByRole = sessionUserRole === 'volunteer'
          const hasVolunteerProfile = volunteerResponse.success
          const shouldProbeVolunteerAccess =
            !hasVolunteerProfile &&
            !isVolunteerByRole &&
            !hasLocalVolunteerProfile &&
            !hasKnownVolunteerStatus

          const hasVolunteerAccess = shouldProbeVolunteerAccess
            ? await detectVolunteerAccess()
            : false

          if (!isMounted) {
            return
          }

          if (hasVolunteerProfile || isVolunteerByRole || hasVolunteerAccess) {
            rememberVolunteerUser(currentUserId)
          }

          setVolunteerStatus(
            hasVolunteerProfile ||
              isVolunteerByRole ||
              hasVolunteerAccess ||
              hasLocalVolunteerProfile ||
              hasKnownVolunteerStatus
              ? 'volunteer'
              : 'not-volunteer',
          )
          return
        }

        clearAuthSession()
      } catch {
        if (!isMounted) {
          return
        }

        clearAuthSession()
      } finally {
        if (isMounted) {
          setSessionStatus('ready')
        }
      }
    }

    function handleUnauthorized() {
      backend.auth.clearAuthToken()
      clearAuthSession()
    }

    void syncSession()
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [
    clearAuthSession,
    rememberVolunteerUser,
    setAccountStatus,
    setAuthSession,
    setSessionStatus,
    setVolunteerStatus,
  ])

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6">
        <div className="w-full max-w-sm rounded-[28px] border border-brand-gray bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-purple-light border-t-brand-purple" />
          <h1 className="mt-5 text-xl font-semibold text-brand-black">
            Verificam sesiunea ta
          </h1>
          <p className="mt-2 text-sm text-brand-gray-text">
            Pregatim aplicatia si verificam daca esti autentificat.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthSessionBootstrap
