import { useState } from 'react';
import { StepBar } from './components';
import { Step1Account } from './steps/Step1Account';
import { Step2Profile } from './steps/Step2Profile';
import { Step3Identity } from './steps/Step3Identity';
import { STEP_TITLES } from './constants';
import type { RegisterFormData } from './types';

// TODO: înlocuiește cu fetcher-ul real când e disponibil.
// import { registerFetcher } from '@/sdk/AuthFetcher';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '', password: '', confirm: '',
  firstName: '', lastName: '', phone: '', city: '',
};

type Props = {
  onSuccess: () => void;
  onSwitch: () => void;
  isMobile: boolean;
};

/**
 * Flow-ul complet de înregistrare în 3 pași:
 *   1. Cont       — email + parolă
 *   2. Profil     — nume, telefon, oraș
 *   3. Identitate — verificare prin cod OTP (email sau telefon)
 *
 * TODO: conectează `handleFinalSubmit` cu fetcher-ul real când e disponibil.
 */
export function RegisterFlow({ onSuccess, onSwitch, isMobile }: Props) {
  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);

  function updateField(key: keyof RegisterFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Apelat după verificarea OTP reușită.
   * Trimite datele complete ale utilizatorului la backend.
   */
  async function handleFinalSubmit() {
    setLoading(true);
    setApiError('');
    try {
      // TODO: înlocuiește cu:
      // await registerFetcher({
      //   email:     formData.email,
      //   password:  formData.password,
      //   firstName: formData.firstName,
      //   lastName:  formData.lastName,
      //   phone:     formData.phone,
      //   city:      formData.city,
      // });
      throw new Error('Fetcher-ul de înregistrare nu este conectat încă.');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Eroare neașteptată. Încearcă din nou.');
    } finally {
      setLoading(false);
      onSuccess();
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