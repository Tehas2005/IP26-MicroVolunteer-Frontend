import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { isRestrictedAccountStatus } from '@/lib/accountStatus'
import { useAuthStore } from '@/store/authStore'

interface RequireRestrictedAccountProps {
  children: ReactNode
}

export function RequireRestrictedAccount({ children }: RequireRestrictedAccountProps) {
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const isGuest = useAuthStore((state) => state.isGuest)
  const user = useAuthStore((state) => state.user)

  if (sessionStatus === 'loading') {
    return null
  }

  if (isGuest) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isRestrictedAccountStatus(user?.accountStatus)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RequireRestrictedAccount

