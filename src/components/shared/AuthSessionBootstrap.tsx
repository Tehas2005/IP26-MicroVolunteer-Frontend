import { type ReactNode, useEffect, useRef } from 'react'

import { authClient } from '@/main'
import { readAccountStatusFromUser } from '@/lib/accountStatus'
import { backend } from '@/lib/backend'
import {
  ROMANIA_CITY_COORDINATES,
  type TaskLocationPayload,
} from '@/lib/romania-city-coordinates'
import type {
  ProfileType,
  VolunteerLocationPointType,
  VolunteerOwnProfileType,
} from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'
import { useVolunteerProfileStore } from '@/store/volunteerProfileStore'

interface AuthSessionBootstrapProps {
  children: ReactNode
}

type VolunteerStoreProfile = {
  hiddenIdentity: boolean
  location: string
  locationCoordinates: TaskLocationPayload
  skills: string[]
}

const LOCATION_MATCH_EPSILON = 0.000001
const PROFILE_DRAFT_KEY_PREFIX = 'mvcr-volunteer-profile-draft'

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

function readHiddenIdentity(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  if ('hiddenIdentity' in payload) {
    return Boolean(payload.hiddenIdentity)
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    return readHiddenIdentity(payload.data)
  }

  if ('profile' in payload && payload.profile && typeof payload.profile === 'object') {
    return readHiddenIdentity(payload.profile)
  }

  return false
}

function sanitizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

function resolveVolunteerLocationPoint(location: string): TaskLocationPayload | null {
  const normalizedLocation = location.trim()

  if (!normalizedLocation) {
    return null
  }

  return ROMANIA_CITY_COORDINATES[normalizedLocation] ?? null
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

  if ('currentLocation' in payload || 'skills' in payload) {
    return payload as VolunteerOwnProfileType['profile']
  }

  return null
}

function buildStoreProfileFromRemote(
  payload: unknown,
  hiddenIdentity: boolean,
): VolunteerStoreProfile | null {
  const remoteProfile = extractVolunteerProfile(payload)
  const currentLocationPoint = remoteProfile?.currentLocation ?? null
  const location = resolveRomanianCityByPoint(currentLocationPoint)

  if (!currentLocationPoint || !location) {
    return null
  }

  return {
    hiddenIdentity,
    location,
    locationCoordinates: currentLocationPoint,
    skills: sanitizeSkills(remoteProfile?.skills),
  }
}

function readLocalVolunteerDraft(userId: string): VolunteerStoreProfile | null {
  const rawDraft = window.localStorage.getItem(`${PROFILE_DRAFT_KEY_PREFIX}:${userId}`)

  if (!rawDraft) {
    return null
  }

  try {
    const draft = JSON.parse(rawDraft) as Record<string, unknown>
    const location = typeof draft.currentLocation === 'string' ? draft.currentLocation.trim() : ''
    const locationCoordinates = resolveVolunteerLocationPoint(location)

    if (!location || !locationCoordinates) {
      return null
    }

    return {
      hiddenIdentity: Boolean(draft.hiddenIdentity),
      location,
      locationCoordinates,
      skills: sanitizeSkills(draft.skills),
    }
  } catch {
    window.localStorage.removeItem(`${PROFILE_DRAFT_KEY_PREFIX}:${userId}`)
    return null
  }
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
  const deleteVolunteerProfile = useVolunteerProfileStore((state) => state.deleteVolunteerProfile)
  const upsertVolunteerProfile = useVolunteerProfileStore((state) => state.upsertVolunteerProfile)

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

        if (response.error) {
          console.log(response.error.message || 'get-session failed')
          clearAuthSession()
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
              accountStatus: readAccountStatusFromUser(response.data.user),
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

          const localDraftProfile = readLocalVolunteerDraft(currentUserId)
          const hiddenIdentity =
            readHiddenIdentity(profileResponse.data) || readHiddenIdentity(volunteerResponse.data)
          const remoteStoreProfile = volunteerResponse.success
            ? buildStoreProfileFromRemote(volunteerResponse.data, hiddenIdentity)
            : null

          if (remoteStoreProfile) {
            upsertVolunteerProfile(currentUserId, remoteStoreProfile)
          } else if (localDraftProfile) {
            upsertVolunteerProfile(currentUserId, localDraftProfile)
          } else if (volunteerResponse.isNotFound) {
            deleteVolunteerProfile(currentUserId)
          }

          const hasLocalVolunteerProfile = Boolean(
            volunteerProfilesByUserIdRef.current[currentUserId],
          )
          const hasKnownVolunteerStatus = Boolean(knownVolunteerUserIdsRef.current[currentUserId])
          const isVolunteerByRole = sessionUserRole === 'volunteer'
          const hasVolunteerProfile = volunteerResponse.success
          const hasLocalDraftVolunteerProfile = Boolean(localDraftProfile)
          const shouldProbeVolunteerAccess =
            !hasVolunteerProfile &&
            !hasLocalDraftVolunteerProfile &&
            !isVolunteerByRole &&
            !hasLocalVolunteerProfile &&
            !hasKnownVolunteerStatus

          const hasVolunteerAccess = shouldProbeVolunteerAccess
            ? await detectVolunteerAccess()
            : false

          if (!isMounted) {
            return
          }

          if (
            hasVolunteerProfile ||
            hasLocalDraftVolunteerProfile ||
            isVolunteerByRole ||
            hasVolunteerAccess
          ) {
            rememberVolunteerUser(currentUserId)
          }

          setVolunteerStatus(
            hasVolunteerProfile ||
              hasLocalDraftVolunteerProfile ||
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

    syncSession()
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [
    clearAuthSession,
    deleteVolunteerProfile,
    rememberVolunteerUser,
    setAccountStatus,
    setAuthSession,
    setSessionStatus,
    setVolunteerStatus,
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
