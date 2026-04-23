import { useState } from 'react';
import { Field, TextInput, StepNavigation } from '../components';
import { validatePhone } from '../validators';
import type { RegisterFormData } from '../types';

type Props = {
  data: RegisterFormData;
  onChange: (key: keyof RegisterFormData, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isMobile: boolean;
};

export function Step2Profile({ data, onChange, onBack, onNext, isMobile }: Props) {
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFormData, boolean>>>({});

  const touch = (key: keyof RegisterFormData) => () =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const errors = {
    firstName: !data.firstName.trim() ? 'Prenumele este obligatoriu.' : '',
    lastName: !data.lastName.trim() ? 'Numele este obligatoriu.' : '',
    phone: validatePhone(data.phone),
  };

  function handleNext() {
    setTouched({ firstName: true, lastName: true, phone: true });
    if (Object.values(errors).some(Boolean)) return;
    onNext();
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 16px' }}>
        <Field label="Prenume" error={touched.firstName ? errors.firstName : ''}>
          <TextInput
            id="firstName"
            value={data.firstName}
            onChange={(v) => onChange('firstName', v)}
            onBlur={touch('firstName')}
            placeholder="Ion"
            hasError={touched.firstName && !!errors.firstName}
          />
        </Field>
        <Field label="Nume" error={touched.lastName ? errors.lastName : ''}>
          <TextInput
            id="lastName"
            value={data.lastName}
            onChange={(v) => onChange('lastName', v)}
            onBlur={touch('lastName')}
            placeholder="Popescu"
            hasError={touched.lastName && !!errors.lastName}
          />
        </Field>
      </div>
      <Field label="Telefon" error={touched.phone ? errors.phone : ''}>
        <TextInput
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(v) => onChange('phone', v)}
          onBlur={touch('phone')}
          placeholder="07XXXXXXXX"
          hasError={touched.phone && !!errors.phone}
        />
      </Field>
      <Field label="Oraș (opțional)">
        <TextInput
          id="city"
          value={data.city}
          onChange={(v) => onChange('city', v)}
          placeholder="Cluj-Napoca"
        />
      </Field>
      <StepNavigation onBack={onBack} onNext={handleNext} nextLabel="Continuă" />
    </div>
  );
}
