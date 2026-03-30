import { useState, useRef, useEffect } from 'react';
import { ErrorBanner, StepNavigation } from '../components';
import type { RegisterFormData } from '../types';

// TODO: înlocuiește cu fetcher-ele reale când sunt disponibile.
// import { sendOtpFetcher, verifyOtpFetcher } from '@/sdk/AuthFetcher';

type OtpChannel = 'email' | 'phone';

type Props = {
  data: RegisterFormData;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  apiError: string;
};

const OTP_LENGTH = 6;

/**
 * Pasul 3 din înregistrare — verificare identitate prin cod OTP.
 * Utilizatorul alege canalul (email sau telefon), primește un cod
 * de 6 cifre și îl introduce pentru a-și confirma identitatea.
 *
 * TODO: conectează `handleSendCode` și `handleSubmit` cu fetcher-ele reale.
 */
export function Step3Identity({ data, onBack, onSubmit, loading, apiError }: Props) {
  const [channel,   setChannel]   = useState<OtpChannel>('email');
  const [codeSent,  setCodeSent]  = useState(false);
  const [otp,       setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState('');
  const [otpError,  setOtpError]  = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pentru „Retrimite codul"
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Destinația afișată utilizatorului (mascată parțial)
  const destination =
    channel === 'email' ? maskEmail(data.email) : maskPhone(data.phone);

  async function handleSendCode() {
    setSending(true);
    setSendError('');
    try {
      // TODO: await sendOtpFetcher({ channel, email: data.email, phone: data.phone });
      await simulateSend(); // șterge când conectezi fetcher-ul
      setCodeSent(true);
      setCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Nu s-a putut trimite codul.');
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setOtpError('Introdu toate cele 6 cifre.');
      return;
    }
    setOtpError('');
    try {
      // TODO: await verifyOtpFetcher({ code, channel, email: data.email, phone: data.phone });
      onSubmit();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Cod incorect. Încearcă din nou.');
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1); // doar ultima cifră introdusă
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError('');

    // Avansează automat la următoarea căsuță
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    // La Backspace pe o căsuță goală, revino la cea anterioară
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next   = [...otp];
    pasted.split('').forEach((digit, i) => { next[i] = digit; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: '1.5rem' }}>
        Ultimul pas — confirmă-ți identitatea printr-un cod primit pe:
      </p>

      {apiError && <ErrorBanner message={apiError} />}

      {/* ── Ecranul 1: alegere canal + trimitere cod ── */}
      {!codeSent && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
            {(['email', 'phone'] as OtpChannel[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `1.5px solid ${channel === c ? '#7C3AED' : '#e2e8f0'}`,
                  background: channel === c ? '#f5f3ff' : 'white',
                  color: channel === c ? '#7C3AED' : '#888',
                  fontWeight: channel === c ? 700 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {c === 'email' ? '✉️  Email' : '📱  Telefon'}
              </button>
            ))}
          </div>

          <div
            style={{
              padding: '10px 14px', borderRadius: 8,
              background: '#f9f7ff', border: '1px solid #e8e0ff',
              marginBottom: '1.25rem', fontSize: 13, color: '#6d28d9',
            }}
          >
            Codul va fi trimis la: <strong>{destination}</strong>
          </div>

          {sendError && <ErrorBanner message={sendError} />}

          <StepNavigation
            onBack={onBack}
            onNext={handleSendCode}
            nextLabel={sending ? 'Se trimite...' : 'Trimite codul'}
            loading={sending}
          />
        </>
      )}

      {/* ── Ecranul 2: introducere cod OTP ── */}
      {codeSent && (
        <>
          <p style={{ fontSize: 13, color: '#555', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Am trimis un cod de <strong>6 cifre</strong> la <strong>{destination}</strong>.
            Verifică și căsuța de spam dacă nu îl găsești.
          </p>

          {/* Căsuțele OTP */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '0.5rem' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                style={{
                  width: 44, height: 52,
                  textAlign: 'center',
                  fontSize: 20, fontWeight: 700,
                  border: `1.5px solid ${otpError ? '#e53e3e' : digit ? '#7C3AED' : '#e2e8f0'}`,
                  borderRadius: 10, outline: 'none',
                  color: '#1a1a1a',
                  background: digit ? '#f5f3ff' : 'white',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              />
            ))}
          </div>

          {otpError && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#e53e3e', marginBottom: '0.75rem' }}>
              ⚠ {otpError}
            </p>
          )}

          {/* Retrimite codul / countdown */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginBottom: '1.25rem' }}>
            {countdown > 0 ? (
              <>Poți retrimite codul în <strong style={{ color: '#7C3AED' }}>{countdown}s</strong></>
            ) : (
              <>
                Nu ai primit codul?{' '}
                <button
                  type="button"
                  onClick={handleSendCode}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#7C3AED',
                    fontWeight: 600, fontSize: 12,
                  }}
                >
                  Retrimite
                </button>
              </>
            )}
          </p>

          <StepNavigation
            onBack={() => setCodeSent(false)}
            onNext={handleSubmit}
            nextLabel="Verifică"
            loading={loading}
          />
        </>
      )}
    </div>
  );
}

// ─── Helpers de mascare ───────────────────────────────────────────────────────

/** Maschează emailul: primele 2 caractere + *** + domeniu. */
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(user.length - 2, 2))}@${domain}`;
}

/** Maschează telefonul: primele 3 caractere + *** + ultimele 2. */
function maskPhone(phone: string): string {
  const clean = phone.replace(/\s/g, '');
  return `${clean.slice(0, 3)}${'*'.repeat(Math.max(clean.length - 5, 3))}${clean.slice(-2)}`;
}

// ─── Simulare trimitere (șterge când conectezi fetcher-ul real) ───────────────

function simulateSend(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}