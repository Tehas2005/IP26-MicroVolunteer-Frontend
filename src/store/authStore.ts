import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  token: string | null
}

export interface AuthState {
  user: AuthUser | null
  isGuest: boolean
  token: string | null
  setUser: (user: AuthUser) => void
  setAuthSession: (session: AuthSession) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isGuest: true,
      token: null,
      setUser: (user) => set({ user, isGuest: false }),
      setAuthSession: ({ user, token }) => set({ user, token, isGuest: false }),
      logout: () => set({ user: null, token: null, isGuest: true }),
    }),
    {
      name: 'mvcr-auth-session',
      partialize: ({ user, isGuest, token }) => ({ user, isGuest, token }),
    },
  ),
)

export default useAuthStore

