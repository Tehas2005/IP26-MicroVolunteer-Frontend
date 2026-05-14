import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

interface RequireAuthenticatedUserProps {
  children: ReactNode
}

export function RequireAuthenticatedUser({ children }: RequireAuthenticatedUserProps) {
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'loading') {
    return null
  }

  if (isGuest) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

export default RequireAuthenticatedUser

