import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { isRestrictedAccountStatus } from '@/lib/accountStatus'
import { useAuthStore } from '@/store/authStore'

interface RequireAvailableAccountProps {
  children: ReactNode
}

export function RequireAvailableAccount({ children }: RequireAvailableAccountProps) {
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const isGuest = useAuthStore((state) => state.isGuest)
  const user = useAuthStore((state) => state.user)

  if (sessionStatus === 'loading') {
    return null
  }

  if (!isGuest && isRestrictedAccountStatus(user?.accountStatus)) {
    return <Navigate to="/cont-blocat" replace />
  }

  return <>{children}</>
}

export default RequireAvailableAccount

