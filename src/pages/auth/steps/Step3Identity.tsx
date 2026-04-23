import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { ErrorBanner } from '../components';
import type { RegisterFormData } from '../types';
import './Step3Identity.css';

type Props = {
  data: RegisterFormData;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  apiError: string;
};

const OTP_LENGTH = 6;

export function Step3Identity({ data, onBack, onSubmit, loading, apiError }: Props) {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskedEmail = maskEmail(data.email);
  const busy = isLoading || loading;

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const nextCode = [...code];
    nextCode[index] = value;
    setCode(nextCode);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const nextCode = pastedData.split('');
      setCode(nextCode);
      setError('');
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const validateCode = () => {
    const fullCode = code.join('');

    if (fullCode.length < OTP_LENGTH || !/^\d{6}$/.test(fullCode)) {
      setError('Codul introdus este invalid. Trebuie să conțină 6 cifre.');
      return false;
    }

    return true;
  };

  const handleVerify = () => {
    if (!validateCode()) {
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      onSubmit();
    }, 2500);
  };

  const handleResendEmail = () => {
    setCode(Array(OTP_LENGTH).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
    console.log('Email retrimis');
  };

  return (
    <div className="identity-step">
      <p className="identity-step__intro">
        Ultimul pas — confirmă-ți identitatea printr-un cod primit pe:
      </p>

      {apiError && <ErrorBanner message={apiError} />}

      <div className="identity-step__frame">
        <div className="identity-step__badge" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="25" r="13" stroke="var(--identity-white)" strokeWidth="4" />
            <path d="M30 38V50" stroke="var(--identity-white)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <p className="identity-step__subtitle">
          Am trimis un cod de verificare la adresa
        </p>
        <p className="identity-step__email">{maskedEmail}</p>

        <div className="identity-step__group">
          <label className="identity-step__label">Cod de verificare *</label>
          <div className="identity-step__inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`identity-step__input ${error ? 'identity-step__input--error' : ''}`}
                autoFocus={index === 0}
                aria-label={`Cifra ${index + 1} din codul de verificare`}
              />
            ))}
          </div>
          {error && <p className="identity-step__error">{error}</p>}
        </div>

        <button
          type="button"
          className={`identity-step__verify ${busy ? 'identity-step__verify--loading' : ''}`}
          onClick={handleVerify}
          disabled={busy}
        >
          {busy ? (
            <>
              <span className="identity-step__spinner" />
              Se verifică...
            </>
          ) : (
            'Verifică'
          )}
        </button>

        <div className="identity-step__resend">
          <span>Nu ai primit codul? </span>
          <button
            type="button"
            className="identity-step__resend-link"
            onClick={handleResendEmail}
          >
            Retrimite email-ul
          </button>
        </div>
      </div>

      <button type="button" className="identity-step__back" onClick={onBack}>
        ← Înapoi la profil
      </button>
    </div>
  );
}

function maskEmail(email: string): string {
  const trimmedEmail = email.trim();
  const [user, domain] = trimmedEmail.split('@');

  if (!user || !domain) {
    return trimmedEmail || 'utilizator@exemplu.ro';
  }

  return `${user.slice(0, 2)}${'*'.repeat(Math.max(user.length - 2, 2))}@${domain}`;
}
