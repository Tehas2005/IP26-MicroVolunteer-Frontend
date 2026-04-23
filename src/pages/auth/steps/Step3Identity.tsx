import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react';
import { ErrorBanner, StepNavigation } from '../components';
import type { RegisterFormData } from '../types';

type OtpChannel = 'email' | 'phone';

type Props = {
  data: RegisterFormData;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  apiError: string;
};

const OTP_LENGTH = 6;

export function Step3Identity({ data, onBack, onSubmit, loading, apiError }: Props) {
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const destination =
    channel === 'email' ? maskEmail(data.email) : maskPhone(data.phone);

  async function handleSendCode() {
    setSending(true);
    setSendError('');
    try {
      await simulateSend();
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
      onSubmit();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Cod incorect. Încearcă din nou.');
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...otp];
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

      {codeSent && (
        <>
          <p style={{ fontSize: 13, color: '#555', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Am trimis un cod de <strong>6 cifre</strong> la <strong>{destination}</strong>.
            Verifică și căsuța de spam dacă nu îl găsești.
          </p>

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

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(user.length - 2, 2))}@${domain}`;
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s/g, '');
  return `${clean.slice(0, 3)}${'*'.repeat(Math.max(clean.length - 5, 3))}${clean.slice(-2)}`;
}

function simulateSend(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
