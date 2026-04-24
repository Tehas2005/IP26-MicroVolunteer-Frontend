import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Characters from './auth/Character';
import { LoginForm } from './auth/LoginForm';
import { RegisterFlow } from './auth/RegisterFlow';
import { SuccessScreen } from './auth/SuccessScreen';
import { TabSwitcher } from './auth/components';
import { useIsMobile } from './auth/hooks/useIsMobile';
import type { AuthMode, RegisterFormData } from './auth/types';
import { useAuthStore } from '@/store/authStore';

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
`;

export interface AuthPageProps {
  mode?: 'login' | 'signup';
}

export default function AuthPage({ mode: routeMode = 'login' }: AuthPageProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setAuthSession } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>(routeMode === 'signup' ? 'register' : 'login');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMode(routeMode === 'signup' ? 'register' : 'login');
    setSuccess(false);
  }, [routeMode]);

  function syncMode(nextMode: AuthMode) {
    setMode(nextMode);
    navigate(nextMode === 'login' ? '/auth/login' : '/auth/signup');
  }

  function handleLoginSuccess(payload: { email: string }) {
    const trimmedEmail = payload.email.trim() || 'utilizator@example.com';
    const inferredName = trimmedEmail.split('@')[0].replace(/[._-]+/g, ' ');
    const normalizedName =
      inferredName.charAt(0).toUpperCase() + inferredName.slice(1) || 'Utilizator';

    setAuthSession({
      token: 'demo-session-token',
      user: {
        id: 'demo-login-user',
        name: normalizedName,
        email: trimmedEmail,
      },
    });

    setSuccess(true);
    setTimeout(() => navigate('/'), 2700);
  }

  function handleRegisterSuccess(payload: RegisterFormData) {
    const fullName = `${payload.firstName} ${payload.lastName}`.trim() || 'Utilizator nou';

    setAuthSession({
      token: 'demo-session-token',
      user: {
        id: 'demo-register-user',
        name: fullName,
        email: payload.email.trim() || 'utilizator@example.com',
      },
    });

    setSuccess(true);
    setTimeout(() => navigate('/'), 2700);
  }

  const formContent = success ? (
    <SuccessScreen mode={mode} />
  ) : (
    <>
      <TabSwitcher mode={mode} setMode={syncMode} />
      {mode === 'login' ? (
        <>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Bun venit înapoi!
          </h1>
          <LoginForm onSuccess={handleLoginSuccess} onSwitch={() => syncMode('register')} />
        </>
      ) : (
        <RegisterFlow onSuccess={handleRegisterSuccess} onSwitch={() => syncMode('login')} isMobile={isMobile} />
      )}
    </>
  );

  return <ResponsiveLayout mode={mode} formContent={formContent} isMobile={isMobile} />;
}

type LayoutProps = { mode: AuthMode; formContent: ReactNode; isMobile: boolean };

function ResponsiveLayout({ mode, formContent, isMobile }: LayoutProps) {
  return (
    <>
      <style>{GLOBAL_STYLES + `
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
            <>
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
                  <p style={{ fontSize: 11, color: '#a78bfa' }}>Ajutor local, rapid și de încredere</p>
                </div>
                <div style={{ width: 160, height: 110, flexShrink: 0 }}>
                  <Characters mode={mode} compact />
                </div>
              </div>
            </>
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
          {formContent}
        </div>
      </div>
    </>
  );
}

function LogoIcon() {
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: 7,
        background: '#7C3AED',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="4" fill="white" opacity="0.9" />
        <path d="M11 3L19 7L19 15L11 19L3 15L3 7Z" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
}
