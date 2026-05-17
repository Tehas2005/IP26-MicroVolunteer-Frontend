import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  accountStatus?: string | null
}

export interface AuthSession {
  user: AuthUser
}

export type AuthSessionStatus = 'loading' | 'ready'

export interface AuthState {
  user: AuthUser | null
  isGuest: boolean
  sessionStatus: AuthSessionStatus
  setAuthSession: (session: AuthSession) => void
  clearAuthSession: () => void
  setSessionStatus: (status: AuthSessionStatus) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: true,
      sessionStatus: 'loading',
      setAuthSession: ({ user }) => set({ user, isGuest: false }),
      clearAuthSession: () => set({ user: null, isGuest: true }),
      setSessionStatus: (sessionStatus) => set({ sessionStatus }),
    }),
    {
      name: 'mvcr-auth-session',
      partialize: ({ user, isGuest }) => ({ user, isGuest }),
    },
  ),
)

export default useAuthStore
