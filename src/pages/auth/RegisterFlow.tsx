import { useState } from 'react';
import { backend } from '@/lib/backend';
import { StepBar } from './components';
import { Step1Account } from './steps/Step1Account';
import { Step2Profile } from './steps/Step2Profile';
import { Step3Identity } from './steps/Step3Identity';
import { STEP_TITLES } from './constants';
import type { RegisterFormData, AuthSuccessPayload } from './types';

const INITIAL_FORM_DATA: RegisterFormData = {
  email: '', password: '', confirm: '',
  firstName: '', lastName: '', phone: '', city: '',
};

type Props = {
  onSuccess: (payload: AuthSuccessPayload) => void;
  onSwitch: () => void;
  isMobile: boolean;
};

export function RegisterFlow({ onSuccess, onSwitch, isMobile }: Props) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  function updateField(key: keyof RegisterFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSignupAndGoToStep3() {
    setSignupLoading(true);
    setSignupError('');

    try {
      const response = await backend.auth.signUp.email({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      });

      if (!response.success || !response.data) {
        setSignupError(response.message ?? 'Eroare la inregistrare. Incearca din nou.');
        return;
      }

      setStep(2);
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Eroare neasteptata.');
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleVerifyCode(code: string) {
    setVerifyLoading(true);
    setVerifyError('');

    try {
      const verificationResponse = await backend.auth.verifyEmail({
        email: formData.email,
        otp: code,
      });

      if (!verificationResponse.success || !verificationResponse.data) {
        setVerifyError(verificationResponse.message ?? 'Codul introdus este invalid sau a expirat.')
        return;
      }

      if (verificationResponse.data.token) {
        backend.auth.setAuthToken(verificationResponse.data.token)
      }

      onSuccess({
        user: {
          id: verificationResponse.data.user.id,
          name: verificationResponse.data.user.name,
          email: verificationResponse.data.user.email,
        },
      });
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Eroare neasteptata.');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResendCode() {
    setResendLoading(true)
    setVerifyError('')

    try {
      const response = await backend.auth.sendVerificationOtp(formData.email)

      if (!response.success) {
        setVerifyError(response.message ?? 'Nu am putut retrimite codul. Incearca din nou.')
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Eroare neasteptata.')
    } finally {
      setResendLoading(false)
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
          onNext={handleSignupAndGoToStep3}
          isMobile={isMobile}
          loading={signupLoading}
          apiError={signupError}
        />
      )}
      {step === 2 && (
        <Step3Identity
          data={formData}
          onBack={() => setStep(1)}
          onSubmit={handleVerifyCode}
          onResend={handleResendCode}
          loading={verifyLoading}
          resendLoading={resendLoading}
          apiError={verifyError}
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
