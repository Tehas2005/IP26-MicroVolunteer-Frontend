import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'

export interface AuthPageProps {
  mode?: 'login' | 'signup'
}

export function AuthPage({ mode = 'login' }: AuthPageProps) {
  const navigate = useNavigate()
  const { setAuthSession } = useAuthStore()
  const [email, setEmail] = useState('ana@example.com')
  const [password, setPassword] = useState('Parola123')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleMockLogin() {
    setIsSubmitting(true)

    await new Promise((resolve) => {
      window.setTimeout(resolve, 900)
    })

    const trimmedEmail = email.trim() || 'ana@example.com'
    const inferredName = trimmedEmail.split('@')[0].replace(/[._-]+/g, ' ')
    const normalizedName =
      inferredName.charAt(0).toUpperCase() + inferredName.slice(1) || 'Utilizator'

    setAuthSession({
      token: 'demo-session-token',
      user: {
        id: 'demo-user',
        name: normalizedName,
        email: trimmedEmail,
      },
    })

    setIsSubmitting(false)
    navigate('/')
  }

  return (
    <section className="bg-brand-cream">
      <div className="mx-auto flex min-h-[calc(100vh-148px)] w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[32px] border border-brand-gray bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-purple">
              {mode === 'login' ? 'Autentificare' : 'Înregistrare'}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-brand-black sm:text-4xl">
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </h1>
          </div>

          {mode === 'login' ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleMockLogin()
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Email</span>
                <Input
                  aria-label="Email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ana@example.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Parolă</span>
                <Input
                  aria-label="Parolă"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Parola123"
                  type="password"
                  value={password}
                />
              </label>

              <Button
                className="mt-2 w-full"
                disabled={isSubmitting || !password.trim()}
                size="lg"
                type="submit"
                variant="primary"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se autentifică...
                  </span>
                ) : (
                  'Log In'
                )}
              </Button>

              <p className="pt-2 text-center text-sm text-brand-gray-text">
                Nu ai cont?{' '}
                <Link
                  className="font-semibold text-brand-purple hover:text-brand-purple-dark"
                  to="/auth/signup"
                >
                  Sign Up
                </Link>
              </p>
            </form>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Nume</span>
                <Input aria-label="Nume" placeholder="Ana Popescu" />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Email</span>
                <Input aria-label="Email" placeholder="ana@example.com" type="email" />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Parolă</span>
                <Input aria-label="Parolă" placeholder="Parola123" type="password" />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-black">Confirmă parola</span>
                <Input
                  aria-label="Confirmă parola"
                  placeholder="Parola123"
                  type="password"
                />
              </label>

              <Button className="mt-2 w-full" size="lg" type="submit" variant="auth">
                Sign Up
              </Button>

              <p className="pt-2 text-center text-sm text-brand-gray-text">
                Ai deja cont?{' '}
                <Link
                  className="font-semibold text-brand-purple hover:text-brand-purple-dark"
                  to="/auth/login"
                >
                  Log In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default AuthPage
