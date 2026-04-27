import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { MvcrLogo } from '@/components/shared/MvcrLogo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface NavAction {
  label: string
  path: string
  type: 'link' | 'ghost' | 'auth'
}

const navActions: NavAction[] = [
  { label: 'Cere Ajutor', path: '/cere-ajutor', type: 'link' },
  { label: 'Profil', path: '/profil', type: 'link' },
  { label: 'Despre Noi', path: '/despre-noi', type: 'link' },
  { label: 'Log In', path: '/auth/login', type: 'ghost' },
  { label: 'Sign Up', path: '/auth/signup', type: 'auth' },
]

const linkClasses =
  'rounded-lg px-3 py-2 text-sm font-medium text-brand-black transition hover:text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2'

interface ActionRendererProps {
  action: NavAction
  onNavigate: (path: string) => void
}

function DesktopAction({ action, onNavigate }: ActionRendererProps) {
  if (action.type === 'link') {
    return (
      <button
        key={action.label}
        aria-label={action.label}
        className={linkClasses}
        onClick={() => onNavigate(action.path)}
        type="button"
      >
        {action.label}
      </button>
    )
  }

  return (
    <Button
      aria-label={action.label}
      className="min-w-[96px]"
      onClick={() => onNavigate(action.path)}
      variant={action.type}
    >
      {action.label}
    </Button>
  )
}

function MobileAction({ action, onNavigate }: ActionRendererProps) {
  if (action.type === 'link') {
    return (
      <button
        key={action.label}
        aria-label={action.label}
        className={cn(linkClasses, 'w-full justify-start text-left')}
        onClick={() => onNavigate(action.path)}
        type="button"
      >
        {action.label}
      </button>
    )
  }

  return (
    <Button
      aria-label={action.label}
      className="w-full justify-center"
      onClick={() => onNavigate(action.path)}
      variant={action.type}
    >
      {action.label}
    </Button>
  )
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { isGuest, logout } = useAuthStore()

  function handleNavigate(path: string) {
    setIsMenuOpen(false)
    navigate(path)
  }

  function handleLogout() {
    setIsMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-gray/30 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          aria-label="Micro-Volunteer Crisis Router"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
          onClick={() => handleNavigate('/')}
          type="button"
        >
          <MvcrLogo />
        </button>

        <nav aria-label="Navigare principală" className="hidden items-center gap-2 md:flex">
          {navActions
            .filter((action) => action.type === 'link' || isGuest)
            .map((action) => (
              <DesktopAction key={action.label} action={action} onNavigate={handleNavigate} />
            ))}
          {!isGuest ? (
            <div className="ml-2 flex items-center gap-3">
              <Button onClick={handleLogout} variant="ghost">
                Ieși din cont
              </Button>
            </div>
          ) : null}
        </nav>

        <Button
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Închide meniul de navigare' : 'Deschide meniul de navigare'}
          className="md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          size="icon"
          variant="ghost"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-brand-gray/30 bg-white transition-all duration-300 ease-out md:hidden',
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav
          aria-label="Navigare principală mobilă"
          className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6"
        >
          {navActions
            .filter((action) => action.type === 'link' || isGuest)
            .map((action) => (
              <MobileAction key={action.label} action={action} onNavigate={handleNavigate} />
            ))}
          {!isGuest ? (
            <>
              <Button className="w-full justify-center" onClick={handleLogout} variant="ghost">
                Ieși din cont
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
