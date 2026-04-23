import { useState } from 'react';
import { StepBar } from './components';
import { Step1Account } from './steps/Step1Account';
import { Step2Profile } from './steps/Step2Profile';
import { Step3Identity } from './steps/Step3Identity';
import { STEP_TITLES } from './constants';
import type { RegisterFormData } from './types';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '', password: '', confirm: '',
  firstName: '', lastName: '', phone: '', city: '',
};

type Props = {
  onSuccess: (payload: RegisterFormData) => void;
  onSwitch: () => void;
  isMobile: boolean;
};

export function RegisterFlow({ onSuccess, onSwitch, isMobile }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);

  function updateField(key: keyof RegisterFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFinalSubmit() {
    setLoading(true);
    setApiError('');
    try {
      onSuccess(formData);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Eroare neașteptată. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 1 }}>
        {STEP_TITLES[step]}
      </h1>
      <p style={{ fontSize: 11, color: '#bbb', marginBottom: '0.75rem' }}>
        Pasul {step + 1} din 3
      </p>
      <StepBar currentStep={step} />

      {step === 0 && (
        <Step1Account
          data={formData}
          onChange={updateField}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <Step2Profile
          data={formData}
          onChange={updateField}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
          isMobile={isMobile}
        />
      )}
      {step === 2 && (
        <Step3Identity
          data={formData}
          onBack={() => setStep(1)}
          onSubmit={handleFinalSubmit}
          loading={loading}
          apiError={apiError}
        />
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: '0.75rem' }}>
        Ai deja cont?{' '}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: '#7C3AED',
            fontWeight: 600, fontSize: 13,
          }}
        >
          Log In
        </button>
      </p>
    </div>
  );
}
