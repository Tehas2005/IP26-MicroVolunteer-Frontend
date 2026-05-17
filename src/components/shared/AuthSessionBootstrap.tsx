import { type ReactNode, useEffect } from 'react'

import { type TaskLocationPayload, ROMANIA_CITY_COORDINATES } from '@/lib/romania-city-coordinates'
import { readAccountStatusFromUser } from '@/lib/accountStatus'
import { backend } from '@/lib/backend'
import { readHiddenIdentityFromResponse } from '@/pages/volunteerProfileUtils'
import type { VolunteerLocationPointType, VolunteerOwnProfileType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'
import { authClient } from '@/main'

interface AuthSessionBootstrapProps {
  children: ReactNode
}

const LOCATION_MATCH_EPSILON = 0.000001

function extractVolunteerProfile(payload: unknown): VolunteerOwnProfileType['profile'] | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('profile' in payload) {
    return (payload as VolunteerOwnProfileType).profile ?? null
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    const nestedData = payload.data as VolunteerOwnProfileType
    return nestedData.profile ?? null
  }

  return null
}

function sanitizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

function resolveRomanianCityByPoint(
  point: VolunteerLocationPointType | TaskLocationPayload | null | undefined,
): string {
  if (!point) {
    return ''
  }

  const matchingCity = Object.entries(ROMANIA_CITY_COORDINATES).find(
    ([, coordinates]) =>
      Math.abs(coordinates.x - point.x) < LOCATION_MATCH_EPSILON &&
      Math.abs(coordinates.y - point.y) < LOCATION_MATCH_EPSILON,
  )

  return matchingCity?.[0] ?? ''
}

export function AuthSessionBootstrap({ children }: AuthSessionBootstrapProps) {
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession)
  const setAuthSession = useAuthStore((state) => state.setAuthSession)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const setSessionStatus = useAuthStore((state) => state.setSessionStatus)
  const deleteVolunteerProfile = useVolunteerProfileStore((state) => state.deleteVolunteerProfile)
  const upsertVolunteerProfile = useVolunteerProfileStore((state) => state.upsertVolunteerProfile)

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      setSessionStatus('loading')

      try {
        const response = await authClient.getSession();

        if (!isMounted) return;

        if (response.error) {
          console.log(response.error.message || 'get-session failed')
          clearAuthSession()
          return
        }

        if (response.data) {
          const userId = response.data.user.id

          setAuthSession({
            user: {
              id: userId,
              name: response.data.user.name,
              email: response.data.user.email,
              accountStatus: readAccountStatusFromUser(response.data.user),
            },
          })

          const [privacyResponse, volunteerProfileResponse] = await Promise.all([
            backend.profile.getByUserId(userId).catch(() => null),
            backend.volunteerProfiles.getMe().catch(() => null),
          ])

          if (!isMounted) return

          const remoteHiddenIdentity =
            privacyResponse?.success && privacyResponse.data
              ? readHiddenIdentityFromResponse(privacyResponse.data)
              : false

          const remoteVolunteerProfile =
            volunteerProfileResponse?.success && volunteerProfileResponse.data
              ? extractVolunteerProfile(volunteerProfileResponse.data)
              : null

          const remoteLocationCoordinates = remoteVolunteerProfile?.currentLocation ?? null
          const remoteLocation = resolveRomanianCityByPoint(remoteLocationCoordinates)

          if (remoteVolunteerProfile && remoteLocationCoordinates && remoteLocation) {
            upsertVolunteerProfile(userId, {
              hiddenIdentity: remoteHiddenIdentity,
              location: remoteLocation,
              locationCoordinates: remoteLocationCoordinates,
              skills: sanitizeSkills(remoteVolunteerProfile.skills),
            })
          } else if (volunteerProfileResponse?.isNotFound) {
            deleteVolunteerProfile(userId)
          }

          return;
        }

        clearAuthSession()
      } catch {
        if (!isMounted) return

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

    syncSession()
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [
    clearAuthSession,
    deleteVolunteerProfile,
    setAuthSession,
    setSessionStatus,
    upsertVolunteerProfile,
  ])

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6">
        <div className="w-full max-w-sm rounded-[28px] border border-brand-gray bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-purple-light border-t-brand-purple" />
          <h1 className="mt-5 text-xl font-semibold text-brand-black">
            Verificăm sesiunea ta
          </h1>
          <p className="mt-2 text-sm text-brand-gray-text">
            Pregătim aplicația și verificăm dacă ești autentificat.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthSessionBootstrap
