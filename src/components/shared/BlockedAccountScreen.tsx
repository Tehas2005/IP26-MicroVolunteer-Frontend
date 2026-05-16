import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { backend } from '@/lib/backend'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function BlockedAccountScreen() {
  const navigate = useNavigate()
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession)

  async function handleLogout() {
    try {
      await backend.auth.signOut()
    } finally {
      backend.auth.clearAuthToken()
      clearAuthSession()
      navigate('/auth/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-brand-gray/80 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-brand-black sm:text-4xl">
          Contul tau este blocat
        </h1>
        <p className="mt-4 text-base leading-7 text-brand-gray-text">
          Accesul la functionalitatile aplicatiei este restrictionat momentan. Te rugam sa
          contactezi echipa proiectului pentru clarificari sau sa incerci din nou dupa ce statusul
          contului este actualizat.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" onClick={() => navigate('/despre-noi')}>
            Contact si detalii
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleLogout()}>
            Iesi din cont
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BlockedAccountScreen
