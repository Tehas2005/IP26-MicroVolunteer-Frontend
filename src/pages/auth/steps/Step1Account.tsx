import { useState } from 'react';
import { Field, TextInput, PasswordInput, PasswordStrength, StepNavigation } from '../components';
import { validateEmail, validatePassword, validateConfirm } from '../validators';
import type { RegisterFormData } from '../types';

type Props = {
  data: RegisterFormData;
  onChange: (key: keyof RegisterFormData, value: string) => void;
  onNext: () => void;
};

export function Step1Account({ data, onChange, onNext }: Props) {
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFormData, boolean>>>({});

  const touch = (key: keyof RegisterFormData) => () =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const errors = {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirm: validateConfirm(data.password, data.confirm),
  };

  function handleNext() {
    setTouched({ email: true, password: true, confirm: true });
    if (Object.values(errors).some(Boolean)) return;
    onNext();
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: '0.75rem' }}>
        Creează-ți credențialele de acces.
      </p>
      <Field label="Email" error={touched.email ? errors.email : ''}>
        <TextInput
          id="email"
          type="email"
          value={data.email}
          onChange={(v) => onChange('email', v)}
          onBlur={touch('email')}
          placeholder="ion@exemplu.ro"
          hasError={touched.email && !!errors.email}
        />
      </Field>
      <Field label="Parolă" error={touched.password ? errors.password : ''}>
        <PasswordInput
          id="password"
          value={data.password}
          onChange={(v) => onChange('password', v)}
          onBlur={touch('password')}
          placeholder="Minim 8 caractere"
          hasError={touched.password && !!errors.password}
        />
        <PasswordStrength password={data.password} />
      </Field>
      <Field label="Confirmă parola" error={touched.confirm ? errors.confirm : ''}>
        <PasswordInput
          id="confirm"
          value={data.confirm}
          onChange={(v) => onChange('confirm', v)}
          onBlur={touch('confirm')}
          placeholder="Repetă parola"
          hasError={touched.confirm && !!errors.confirm}
        />
      </Field>
      <StepNavigation onNext={handleNext} nextLabel="Continuă" />
    </div>
  );
}
