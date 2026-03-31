import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import './EmailVerification.css';

interface EmailVerificationProps {
  onVerificationComplete?: (code: string) => void;
  email?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  onVerificationComplete,
  email = "ion@exemplu.ro"
}) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Permite doar cifre
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // TODO: Implementează auto-focus pe următorul input
    // if (value && index < 5) {
    //   inputRefs.current[index + 1]?.focus();
    // }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // TODO: Implementează logica de backspace pentru navigare înapoi
    // if (e.key === 'Backspace' && !code[index] && index > 0) {
    //   inputRefs.current[index - 1]?.focus();
    // }
  };

  const validateCode = (): boolean => {
    const fullCode = code.join('');
    
    if (fullCode.length < 6) {
      setError('Codul introdus este invalid. Trebuie să conțină 6 cifre.');
      return false;
    }
    
    if (!/^\d{6}$/.test(fullCode)) {
      setError('Codul introdus este invalid. Trebuie să conțină 6 cifre.');
      return false;
    }
    
    return true;
  };

  const handleVerify = async () => {
    if (!validateCode()) {
      return;
    }

    setIsLoading(true);
    setError('');

    // TODO: Implementează simulare apel API (2-3 secunde)
    // TODO: Implementează success screen după verificare
    setTimeout(() => {
      setIsLoading(false);
      const fullCode = code.join('');
      console.log('Cod verificat:', fullCode);
      
      if (onVerificationComplete) {
        onVerificationComplete(fullCode);
      }
    }, 2500);
  };

  const handleResendEmail = () => {
    // TODO: Implementează logica de retrimitere email
    setCode(['', '', '', '', '', '']);
    setError('');
    console.log('Email retrimis');
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="logo-container">
          <div className="logo">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <rect width="60" height="60" rx="12" fill="#10B981"/>
              <circle cx="30" cy="25" r="8" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M30 33L30 45" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="30" cy="47" r="1.5" fill="white"/>
            </svg>
          </div>
        </div>

        <h1 className="verification-title">Verificare Identitate</h1>
        <p className="verification-subtitle">
          Am trimis un cod de verificare la adresa<br />
          <strong>{email}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Cod de verificare *</label>
          <div className="code-inputs">
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
                className={`code-input ${error ? 'error' : ''}`}
              />
            ))}
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>

        <button 
          className={`verify-button ${isLoading ? 'loading' : ''}`}
          onClick={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Se verifică...
            </>
          ) : (
            'Verifică'
          )}
        </button>

        <div className="resend-container">
          <span className="resend-text">Nu ai primit codul? </span>
          <button className="resend-link" onClick={handleResendEmail}>
            Retrimite email-ul
          </button>
        </div>

        <div className="footer-text">
          © 2025 Micro-Volunteer Crisis Router
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;