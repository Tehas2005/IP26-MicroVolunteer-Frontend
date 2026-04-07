import { useState } from 'react';
import { Field, TextInput, PasswordInput, ErrorBanner } from './components';
import { validateEmail } from './validators';
import { primaryButtonStyle } from './constants';

// Legarea la backend se va face prin fetchers — placeholder până atunci.
// import { loginFetcher } from '@/sdk/AuthFetcher';

type Props = {
  onSuccess: () => void;
  onSwitch: () => void;
};

/**
 * Formularul de autentificare.
 * Apelează API-ul de login și stochează token-ul la succes.
 *
 * TODO: înlocuiește `apiLogin` cu fetcher-ul real când e disponibil.
 */
export function LoginForm({ onSuccess, onSwitch }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const errors = {
    email:    validateEmail(email),
    password: password ? '' : 'Parola obligatorie.',
  };

  async function handleLogin() {
    setTouched({ email: true, password: true });
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    setApiError('');
    try {
      // TODO: înlocuiește cu: const res = await loginFetcher({ email, password, remember });
      // if (res.success) onSuccess();
      onSuccess(); // Placeholder până când se implementează fetcher-ul
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
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
      <Field label="Parolă" error={touched.password ? errors.password : ''}>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="••••••••"
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
          Ține-mă minte 30 zile
        </label>
        <button
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13 }}
        >
          Parolă uitată?
        </button>
      </div>
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        style={{ ...primaryButtonStyle(loading), height: 40, marginTop: '1rem', width: '50%', marginLeft: 'auto', marginRight: 'auto', display: 'flex' }}
      >
        {loading ? 'Se autentifică...' : 'Log In'}
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
    </div>
  );
}

// ─── Iconițe ──────────────────────────────────────────────────────────────────

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