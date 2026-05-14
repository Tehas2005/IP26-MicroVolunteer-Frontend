import { ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { backend } from '@/lib/backend'
import { useAuthStore } from '@/store/authStore'

export function BlockedAccountPage() {
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await backend.auth.signOut()
    } finally {
      backend.auth.clearAuthToken()
      clearAuthSession()
      setIsLoggingOut(false)
      window.location.replace('/auth/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg rounded-[32px] border border-brand-gray/80 bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-light/70 text-brand-purple">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-brand-black sm:text-3xl">
          Cont blocat
        </h1>
        <p className="mt-4 text-sm leading-7 text-brand-gray-text sm:text-base">
          Contul tau a fost suspendat din cauza evaluarilor scazute primite din partea
          comunitatii.
        </p>

        <div className="mt-8">
          <Button
            className="w-full sm:w-auto sm:min-w-[200px]"
            disabled={isLoggingOut}
            onClick={handleLogout}
            variant="auth"
          >
            {isLoggingOut ? 'Se deconecteaza...' : 'Deconectare'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BlockedAccountPage
