import { type ReactNode, useEffect } from 'react'

import { backend } from '@/lib/backend'
import { useAuthStore } from '@/store/authStore'

interface AuthSessionBootstrapProps {
  children: ReactNode
}

export function AuthSessionBootstrap({ children }: AuthSessionBootstrapProps) {
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession)
  const setAuthSession = useAuthStore((state) => state.setAuthSession)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const setSessionStatus = useAuthStore((state) => state.setSessionStatus)

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      setSessionStatus('loading')

      try {
        const response = await backend.auth.getSession()

        if (!isMounted) return

        if (response.success && response.data?.user && response.data.session) {
          setAuthSession({
            user: {
              id: response.data.user.id,
              name: response.data.user.name,
              email: response.data.user.email,
            },
          })
          return
        }

        backend.auth.clearAuthToken()
        clearAuthSession()
      } catch {
        if (!isMounted) return
        backend.auth.clearAuthToken()
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
  }, [clearAuthSession, setAuthSession, setSessionStatus])

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
