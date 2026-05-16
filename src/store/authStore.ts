import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  role?: string | null
}

export interface AuthSession {
  user: AuthUser
}

export type AuthSessionStatus = 'loading' | 'ready'
export type AccountAccessStatus = 'unknown' | 'active' | 'blocked'
export type VolunteerAccessStatus = 'unknown' | 'volunteer' | 'not-volunteer'

export interface AuthState {
  user: AuthUser | null
  isGuest: boolean
  sessionStatus: AuthSessionStatus
  accountStatus: AccountAccessStatus
  volunteerStatus: VolunteerAccessStatus
  knownVolunteerUserIds: Record<string, true>
  setAuthSession: (session: AuthSession) => void
  clearAuthSession: () => void
  setSessionStatus: (status: AuthSessionStatus) => void
  setAccountStatus: (status: AccountAccessStatus) => void
  setVolunteerStatus: (status: VolunteerAccessStatus) => void
  rememberVolunteerUser: (userId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: true,
      sessionStatus: 'loading',
      accountStatus: 'unknown',
      volunteerStatus: 'unknown',
      knownVolunteerUserIds: {},
      setAuthSession: ({ user }) => set({ user, isGuest: false }),
      clearAuthSession: () =>
        set({
          user: null,
          isGuest: true,
          accountStatus: 'unknown',
          volunteerStatus: 'unknown',
        }),
      setSessionStatus: (sessionStatus) => set({ sessionStatus }),
      setAccountStatus: (accountStatus) => set({ accountStatus }),
      setVolunteerStatus: (volunteerStatus) => set({ volunteerStatus }),
      rememberVolunteerUser: (userId) =>
        set((state) => ({
          knownVolunteerUserIds: userId.trim()
            ? {
                ...state.knownVolunteerUserIds,
                [userId.trim()]: true,
              }
            : state.knownVolunteerUserIds,
        })),
    }),
    {
      name: 'mvcr-auth-session',
      partialize: ({ user, isGuest, accountStatus, volunteerStatus, knownVolunteerUserIds }) => ({
        user,
        isGuest,
        accountStatus,
        volunteerStatus,
        knownVolunteerUserIds,
      }),
    },
  ),
)

export default useAuthStore
