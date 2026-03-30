import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Characters from './Character';
import { LoginForm } from './LoginForm';
import { RegisterFlow } from './RegisterFlow';
import { SuccessScreen } from './SuccessScreen';
import { TabSwitcher } from './components';
import { useIsMobile } from './hooks/useIsMobile';
import type { AuthMode } from './types';

// ─── CSS global (injectat o singură dată) ─────────────────────────────────────
// Resetează html/body la dimensiune completă și definește animațiile folosite
// de SuccessScreen și alte componente.
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

/**
 * Pagina principală de autentificare.
 * Gestionează starea globală (mod curent + succes) și decide layout-ul
 * (mobil vs desktop), delegând conținutul formularului către LoginForm
 * sau RegisterFlow.
 */
export default function AuthPage() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [mode,    setMode]    = useState<AuthMode>('login');
  const [success, setSuccess] = useState(false);

  function handleSuccess() {
    setSuccess(true);
    setTimeout(() => navigate('/dashboard'), 2700);
  }

  const formContent = success ? (
    <SuccessScreen mode={mode} />
  ) : (
    <>
      <TabSwitcher mode={mode} setMode={setMode} />
      {mode === 'login' ? (
        <>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Bun venit înapoi!
          </h1>
          <LoginForm onSuccess={handleSuccess} onSwitch={() => setMode('register')} />
        </>
      ) : (
        <RegisterFlow onSuccess={handleSuccess} onSwitch={() => setMode('login')} isMobile={isMobile} />
      )}
    </>
  );

  if (isMobile) return <MobileLayout mode={mode} formContent={formContent} />;
  return <DesktopLayout mode={mode} formContent={formContent} />;
}

// ─── Layout-uri ───────────────────────────────────────────────────────────────

type LayoutProps = { mode: AuthMode; formContent: React.ReactNode };

function MobileLayout({ mode, formContent }: LayoutProps) {
  return (
    <>
      <style>{GLOBAL_STYLES + `button:not(:disabled):active { opacity: 0.75; }`}</style>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'white',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header violet cu logo și personaje compacte */}
        <div
          style={{
            background: '#f5f3ff', padding: '1rem 1.5rem 0',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            minHeight: 130, flexShrink: 0,
          }}
        >
          <div style={{ paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <LogoIcon />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Micro-Volunteer</span>
            </div>
            <p style={{ fontSize: 11, color: '#a78bfa' }}>Ajutor local, rapid și de încredere</p>
          </div>
          <div style={{ width: 160, height: 110 }}>
            <Characters mode={mode} compact />
          </div>
        </div>
        {/* Formular scrollabil */}
        <div style={{ flex: 1, padding: '1.5rem 1.5rem 2rem', overflowY: 'auto' }}>
          {formContent}
        </div>
      </div>
    </>
  );
}

function DesktopLayout({ mode, formContent }: LayoutProps) {
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
          position: 'fixed', inset: 0, display: 'flex', background: 'white',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Panou stânga — ilustrație animată */}
        <div
          style={{
            width: '50%', background: '#f5f3ff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem', overflow: 'hidden',
          }}
        >
          <div className="character-container" style={{ width: '100%', maxWidth: 400, flex: 1, display: 'flex', alignItems: 'center' }}>
            <Characters mode={mode} />
          </div>
          <p style={{ fontSize: 11, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Micro-Volunteer Crisis Router
          </p>
        </div>
        {/* Panou dreapta — formular */}
        <div
          style={{
           // width: 'min(100%, 460px)',
           width: '50%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            padding: '1.5rem 2.5rem', overflow: 'hidden',
          }}
        >
          {formContent}
        </div>
      </div>
    </>
  );
}

// ─── Iconițe ──────────────────────────────────────────────────────────────────

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