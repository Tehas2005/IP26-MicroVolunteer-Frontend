import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

import Characters from './auth/Character'
import { LoginForm } from './auth/LoginForm'
import { RegisterFlow } from './auth/RegisterFlow'
import { SuccessScreen } from './auth/SuccessScreen'
import { TabSwitcher } from './auth/components'
import { useIsMobile } from './auth/hooks/useIsMobile'
import type { AuthMode, AuthSuccessPayload } from './auth/types'

const GLOBAL_STYLES = `
  html, body {
    margin: 0 !important; padding: 0 !important;
    width: 100% !important; height: 100% !important;
    overflow: hidden;
  }
  #root, [data-reactroot] {
    width: 100% !important; height: 100% !important;
    margin: 0 !important; padding: 0 !important;
  }
  @keyframes mv-spin     { to { transform: rotate(360deg); } }
  @keyframes mv-progress { from { transform: scaleX(0); transform-origin: left; }
                           to   { transform: scaleX(1); transform-origin: left; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input::placeholder { color: #ccc; }
  select option { color: #1a1a1a; }
`

export interface AuthPageProps {
  mode?: 'login' | 'signup'
}

export default function AuthPage({ mode: routeMode = 'login' }: AuthPageProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { isGuest, sessionStatus, setAuthSession } = useAuthStore()
  const [mode, setMode] = useState<AuthMode>(routeMode === 'signup' ? 'register' : 'login')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setMode(routeMode === 'signup' ? 'register' : 'login')
    setSuccess(false)
  }, [routeMode])

  useEffect(() => {
    if (!success && sessionStatus === 'ready' && !isGuest) {
      navigate('/')
    }
  }, [isGuest, navigate, sessionStatus, success])

  function syncMode(nextMode: AuthMode) {
    setMode(nextMode)
    navigate(nextMode === 'login' ? '/auth/login' : '/auth/signup')
  }

  function handleLoginSuccess(payload: AuthSuccessPayload) {
    setAuthSession({ user: payload.user })
    setSuccess(true)
    setTimeout(() => navigate('/'), 2700)
  }

  function handleRegisterSuccess(payload: AuthSuccessPayload) {
    setAuthSession({ user: payload.user })
    setSuccess(true)
    setTimeout(() => navigate('/'), 2700)
  }

  const formContent = success ? (
    <SuccessScreen mode={mode} />
  ) : (
    <>
      <TabSwitcher mode={mode} setMode={syncMode} />
      {mode === 'login' ? (
        <>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Bun venit inapoi!
          </h1>
          <LoginForm onSuccess={handleLoginSuccess} onSwitch={() => syncMode('register')} />
        </>
      ) : (
        <RegisterFlow onSuccess={handleRegisterSuccess} onSwitch={() => syncMode('login')} isMobile={isMobile} />
      )}
    </>
  )

  return (
    <ResponsiveLayout
      formContent={formContent}
      isMobile={isMobile}
      mode={mode}
      onGoHome={() => navigate('/')}
    />
  )
}

type LayoutProps = {
  mode: AuthMode
  formContent: ReactNode
  isMobile: boolean
  onGoHome: () => void
}

function ResponsiveLayout({ mode, formContent, isMobile, onGoHome }: LayoutProps) {
  return (
    <>
      <style>{`${GLOBAL_STYLES}
        button:not(:disabled):hover { opacity: 0.85; }
        @media (max-width: 1440px) and (min-width: 768px) {
          .character-container { max-width: 150px !important; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          background: 'white',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: isMobile ? '100%' : '50%',
            background: '#f5f3ff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: isMobile ? 'flex-end' : 'center',
            padding: isMobile ? '1rem 1.5rem 0' : '2rem',
            overflow: 'hidden',
            minHeight: isMobile ? 130 : '100vh',
            flexShrink: 0,
          }}
        >
          {isMobile ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                minHeight: 130,
                gap: 16,
              }}
            >
              <div style={{ paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <LogoIcon />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Micro-Volunteer</span>
                </div>
                <p style={{ fontSize: 11, color: '#a78bfa' }}>Ajutor local, rapid si de incredere</p>
              </div>
              <div style={{ width: 160, height: 110, flexShrink: 0 }}>
                <Characters compact mode={mode} />
              </div>
            </div>
          ) : (
            <>
              <div
                className="character-container"
                style={{ width: '100%', maxWidth: 400, flex: 1, display: 'flex', alignItems: 'center' }}
              >
                <Characters mode={mode} />
              </div>
              <p style={{ fontSize: 11, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Micro-Volunteer Crisis Router
              </p>
            </>
          )}
        </div>
        <div
          style={{
            width: isMobile ? '100%' : '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: isMobile ? '1.5rem 1.5rem 2rem' : '2.5rem 2.5rem 3rem',
            minHeight: isMobile ? 'auto' : '100vh',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <Button className="mb-6 w-fit" onClick={onGoHome} variant="ghost">
            ← Inapoi pe pagina principala
          </Button>
          {formContent}
        </div>
      </div>
    </>
  )
}

function LogoIcon() {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: '#7C3AED',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg fill="none" height="14" viewBox="0 0 22 22" width="14">
        <circle cx="11" cy="11" fill="white" opacity="0.9" r="4" />
        <path
          d="M11 3L19 7L19 15L11 19L3 15L3 7Z"
          fill="none"
          opacity="0.6"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}
