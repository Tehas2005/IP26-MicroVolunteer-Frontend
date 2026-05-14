import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOCKED_LOGIN_MESSAGE, isRestrictedAccountStatus, readAccountStatusFromUser } from '@/lib/accountStatus';
import { backend } from '@/lib/backend';
import { useAuthStore } from '@/store/authStore';
import { Field, TextInput, PasswordInput, ErrorBanner } from './components';
import { validateEmail } from './validators';
import { primaryButtonStyle } from './constants';
import type { AuthSuccessPayload } from './types';
import { authClient } from '@/main';

type Props = {
  onSuccess: (payload: AuthSuccessPayload) => void;
  onSwitch: () => void;
};

export function LoginForm({ onSuccess, onSwitch }: Props) {
  const navigate = useNavigate();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTouched, setForgotTouched] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const errors = {
    email: validateEmail(email),
    password: password ? '' : 'Parola obligatorie.',
  };

  function simulateBlockedSession() {
    setApiError('');
    setAuthSession({
      user: {
        id: 'demo-blocked-user',
        name: 'Cont Bloccat Demo',
        email: 'blocked-demo@example.com',
        accountStatus: 'BLOCKED',
      },
    });
    navigate('/');
  }

  async function handleLogin() {
    setTouched({ email: true, password: true });
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    setApiError('');

    try {
      
      const response = await authClient.signIn.email({
        email,
        password,
      })

      if (response.error) {
        setApiError(response.error.message || 'Autentificarea a esuat.');
        return;
      }

      const accountStatus = readAccountStatusFromUser(response.data.user)

      if (isRestrictedAccountStatus(accountStatus)) {
        try {
          await backend.auth.signOut()
        } catch {
          // Clear the local auth token even if sign-out fails.
        } finally {
          backend.auth.clearAuthToken()
        }

        setApiError(BLOCKED_LOGIN_MESSAGE)
        return
      }

      onSuccess({
        user: {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          accountStatus,
        },
      });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Autentificarea a esuat.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setForgotTouched(true);
    if (validateEmail(forgotEmail)) return;

    setForgotLoading(true);
    setForgotError('');

    try {
      const response = await backend.auth.requestPasswordReset({
        email: forgotEmail,
      });

      if (!response.success) {
        setForgotError(response.message ?? 'Nu s-a putut trimite emailul.');
        return;
      }

      setForgotSuccess(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Eroare neasteptata.');
    } finally {
      setForgotLoading(false);
    }
  }

  if (forgotMode) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: '0.75rem' }}>
          Introdu adresa de email si iti trimitem un cod de resetare.
        </p>

        {forgotError && <ErrorBanner message={forgotError} />}

        {forgotSuccess ? (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#f0fff4', border: '1px solid #9ae6b4',
            color: '#276749', fontSize: 13, marginBottom: '1rem',
          }}>
            Cod trimis! Verifica emailul, apoi continua cu resetarea parolei.
          </div>
        ) : (
          <Field label="Email" error={forgotTouched ? validateEmail(forgotEmail) : ''}>
            <TextInput
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={setForgotEmail}
              onBlur={() => setForgotTouched(true)}
              placeholder="anna@gmail.com"
              hasError={forgotTouched && !!validateEmail(forgotEmail)}
            />
          </Field>
        )}

        {!forgotSuccess && (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
            style={{ ...primaryButtonStyle(forgotLoading), height: 40, marginTop: '0.5rem', width: '50%', marginLeft: 'auto', marginRight: 'auto', display: 'flex' }}
          >
            {forgotLoading ? 'Se trimite...' : 'Trimite cod'}
          </button>
        )}

        {forgotSuccess && (
          <button
            type="button"
            onClick={() => navigate(`/auth/reset-password?email=${encodeURIComponent(forgotEmail)}`)}
            style={{ ...primaryButtonStyle(false), height: 40, marginTop: '0.5rem', width: '50%', marginLeft: 'auto', marginRight: 'auto', display: 'flex' }}
          >
            Introdu codul
          </button>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => { setForgotMode(false); setForgotSuccess(false); setForgotError(''); setForgotTouched(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontWeight: 600, fontSize: 13 }}
          >
            Inapoi la login
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      {apiError && <ErrorBanner message={apiError} />}
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: '0.75rem' }}>
        Introdu datele tale pentru a continua.
      </p>
      <Field label="Email" error={touched.email ? errors.email : ''}>
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="anna@gmail.com"
          hasError={touched.email && !!errors.email}
        />
      </Field>
      <Field label="Parola" error={touched.password ? errors.password : ''}>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="********"
          hasError={touched.password && !!errors.password}
        />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: '#7C3AED' }}
          />
          Tine-ma minte 30 zile
        </label>
        <button
          type="button"
          onClick={() => setForgotMode(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13 }}
        >
          Parola uitata?
        </button>
      </div>
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        style={{ ...primaryButtonStyle(loading), height: 40, marginTop: '1rem', width: '50%', marginLeft: 'auto', marginRight: 'auto', display: 'flex' }}
      >
        {loading ? 'Se autentifica...' : 'Log In'}
      </button>
      <button
        type="button"
        style={{
          width: '50%', height: 40, marginLeft: 'auto', marginRight: 'auto',
          border: '1.5px solid #e2e8f0', borderRadius: 12,
          marginTop: '0.6rem', background: 'white',
          fontSize: 14, cursor: 'pointer', color: '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <GoogleIcon />
        Log in with Google
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: '0.75rem' }}>
        Nu ai cont?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', fontWeight: 600, fontSize: 13 }}
        >
          Sign Up
        </button>
      </p>
      {import.meta.env.DEV && (
        <div
          style={{
            marginTop: '1rem',
            padding: '12px 14px',
            borderRadius: 12,
            background: '#faf5ff',
            border: '1px solid #ddd6fe',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6d28d9', marginBottom: '0.75rem' }}>
            Demo FE-013
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => setApiError(BLOCKED_LOGIN_MESSAGE)}
              style={{
                border: '1px solid #c4b5fd',
                borderRadius: 10,
                background: 'white',
                color: '#4c1d95',
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Simuleaza eroarea de login pentru cont blocat
            </button>
            <button
              type="button"
              onClick={simulateBlockedSession}
              style={{
                border: '1px solid #7C3AED',
                borderRadius: 10,
                background: '#7C3AED',
                color: 'white',
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Simuleaza sesiune blocata si testeaza guard-ul
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
