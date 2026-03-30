import { useState } from 'react';
import { inputStyle, primaryButtonStyle, STEP_LABELS } from '../constants';
import { passwordScore } from '../validators';

// ─── Field ────────────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

/** Container pentru un câmp de formular: etichetă + input + mesaj de eroare. */
export function Field({ label, error, children }: FieldProps) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <label
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#aaa',
          marginBottom: 3,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#e53e3e', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

type TextInputProps = {
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  maxLength?: number;
};

/** Input text simplu cu border animat și suport pentru validare. */
export function TextInput({
  id, type = 'text', value, onChange, onBlur, placeholder, hasError, maxLength,
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      type={type}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); onBlur?.(); }}
      placeholder={placeholder}
      style={inputStyle(focused, !!hasError)}
    />
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
};

/** Input parolă cu buton de toggle vizibilitate. */
export function PasswordInput({ id, value, onChange, onBlur, placeholder, hasError }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        placeholder={placeholder}
        style={{ ...inputStyle(focused, !!hasError), paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 0, top: '50%',
          transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#aaa', padding: 8,
        }}
      >
        {visible ? '🙈' : '🙉'}
      </button>
    </div>
  );
}

// ─── PasswordStrength ─────────────────────────────────────────────────────────

const SCORE_COLORS = ['#e53e3e', '#e53e3e', '#d97706', '#059669', '#047857'];
const SCORE_LABELS = ['Slabă', 'Slabă', 'Medie', 'Bună', 'Puternică'];

/** Bara vizuală de putere a parolei (apare doar când există input). */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = passwordScore(password);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < score ? SCORE_COLORS[score] : '#e2e8f0',
            }}
          />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: SCORE_COLORS[score] }}>
        Parolă {SCORE_LABELS[score]}
      </p>
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

/** Banner roșu pentru erori venite de la API. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px', borderRadius: 8,
        background: '#fff5f5', border: '1px solid #feb2b2',
        color: '#c53030', fontSize: 13,
        marginBottom: '1rem', lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}

// ─── StepBar ──────────────────────────────────────────────────────────────────

/** Bara de progres pentru cei 3 pași ai înregistrării. */
export function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.9rem' }}>
      {STEP_LABELS.map((label, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: isDone ? '#7C3AED' : isActive ? '#1a1a1a' : '#f0f0f0',
                  color: isDone || isActive ? 'white' : '#bbb',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#1a1a1a' : isDone ? '#7C3AED' : '#bbb',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1, height: 1.5,
                  background: isDone ? '#7C3AED' : '#e2e8f0',
                  margin: '0 8px', marginBottom: 14,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── StepNavigation ───────────────────────────────────────────────────────────

type StepNavigationProps = {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  loading?: boolean;
};

/** Butoanele de navigare Înapoi (←) și Continuă/Submit ale unui pas. */
export function StepNavigation({ onBack, onNext, nextLabel, loading }: StepNavigationProps) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            flexShrink: 0, width: 46, height: 46,
            border: '1.5px solid #e2e8f0', borderRadius: 12,
            background: 'white', cursor: 'pointer',
            color: '#888', fontSize: 18,
          }}
        >
          ←
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        style={{ ...primaryButtonStyle(!!loading), marginTop: 0, flex: 1, height: 46 }}
      >
        {loading ? 'Se procesează...' : `${nextLabel} →`}
      </button>
    </div>
  );
}

// ─── TabSwitcher ──────────────────────────────────────────────────────────────

import type { AuthMode } from '../types';

type TabSwitcherProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
};

/** Tab-urile de comutare între Log In și Sign Up. */
export function TabSwitcher({ mode, setMode }: TabSwitcherProps) {
  return (
    <div
      style={{
        display: 'flex', gap: 4,
        background: '#f9f9f9', borderRadius: 8,
        padding: 4, marginBottom: '1rem',
      }}
    >
      {(['login', 'register'] as AuthMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          style={{
            flex: 1, height: 36, border: 'none', cursor: 'pointer',
            borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
            background: mode === m ? 'white' : 'transparent',
            color: mode === m ? '#1a1a1a' : '#aaa',
            boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {m === 'login' ? 'LOG IN' : 'SIGN UP'}
        </button>
      ))}
    </div>
  );
}