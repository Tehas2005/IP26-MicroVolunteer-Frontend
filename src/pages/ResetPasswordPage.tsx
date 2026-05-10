import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { backend } from '@/lib/backend'

const s = {
  page: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f3ff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '2rem 2rem',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#aaa', marginBottom: '1.5rem' },
  label: {
    display: 'block' as const,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#aaa',
    marginBottom: 3,
  },
  field: { marginBottom: '0.8rem' },
  input: (hasError: boolean) => ({
    width: '100%',
    height: 40,
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#e53e3e' : '#e2e8f0'}`,
    padding: '0 12px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }),
  error: { margin: '3px 0 0', fontSize: 11, color: '#e53e3e' },
  btn: (loading: boolean) => ({
    width: '100%',
    height: 42,
    borderRadius: 12,
    border: 'none',
    background: loading ? '#a78bfa' : '#7C3AED',
    color: 'white',
    fontWeight: 700,
    fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '1rem',
  }),
  errorBanner: {
    padding: '10px 14px',
    borderRadius: 8,
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    color: '#c53030',
    fontSize: 13,
    marginBottom: '1rem',
  },
  successBanner: {
    padding: '10px 14px',
    borderRadius: 8,
    background: '#f0fff4',
    border: '1px solid #9ae6b4',
    color: '#276749',
    fontSize: 13,
    marginBottom: '1rem',
  },
  backLink: {
    display: 'block' as const,
    textAlign: 'center' as const,
    marginTop: '1rem',
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
}

function validateEmail(email: string) {
  const trimmed = email.trim()

  if (!trimmed) {
    return 'Emailul este obligatoriu.'
  }

  return /\S+@\S+\.\S+/.test(trimmed) ? '' : 'Email invalid.'
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const defaultEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams])

  const [email, setEmail] = useState(defaultEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({
    email: false,
    otp: false,
    newPassword: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const errors = {
    email: validateEmail(email),
    otp: /^\d{6}$/.test(otp.trim()) ? '' : 'Codul trebuie sa aiba 6 cifre.',
    newPassword: newPassword.length < 8 ? 'Parola trebuie sa aiba minim 8 caractere.' : '',
    confirm: confirm !== newPassword ? 'Parolele nu se potrivesc.' : '',
  }

  async function handleSubmit() {
    setTouched({
      email: true,
      otp: true,
      newPassword: true,
      confirm: true,
    })

    if (errors.email || errors.otp || errors.newPassword || errors.confirm) {
      return
    }

    setLoading(true)
    setApiError('')

    try {
      const response = await backend.auth.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password: newPassword,
      })

      if (!response.success) {
        setApiError(response.message ?? 'Resetarea parolei a esuat.')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 3000)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Eroare neasteptata.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={s.title}>Parola schimbata!</p>
          <div style={s.successBanner}>
            Parola a fost resetata cu succes. Vei fi redirectionat la login in cateva secunde.
          </div>
          <button style={s.btn(false)} onClick={() => navigate('/auth/login')}>
            Mergi la login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.title}>Reseteaza parola</p>
        <p style={s.subtitle}>Introdu emailul, codul primit si noua parola.</p>

        {apiError && <div style={s.errorBanner}>{apiError}</div>}

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="anna@gmail.com"
            style={s.input(touched.email && !!errors.email)}
          />
          {touched.email && errors.email && <p style={s.error}>! {errors.email}</p>}
        </div>

        <div style={s.field}>
          <label style={s.label}>Cod OTP</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
            placeholder="123456"
            style={s.input(touched.otp && !!errors.otp)}
          />
          {touched.otp && errors.otp && <p style={s.error}>! {errors.otp}</p>}
        </div>

        <div style={s.field}>
          <label style={s.label}>Parola noua</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
            placeholder="********"
            style={s.input(touched.newPassword && !!errors.newPassword)}
          />
          {touched.newPassword && errors.newPassword && (
            <p style={s.error}>! {errors.newPassword}</p>
          )}
        </div>

        <div style={s.field}>
          <label style={s.label}>Confirma parola</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            placeholder="********"
            style={s.input(touched.confirm && !!errors.confirm)}
          />
          {touched.confirm && errors.confirm && <p style={s.error}>! {errors.confirm}</p>}
        </div>

        <button style={s.btn(loading)} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Se proceseaza...' : 'Reseteaza parola'}
        </button>

        <button style={s.backLink} onClick={() => navigate('/auth/login')}>
          Inapoi la login
        </button>
      </div>
    </div>
  )
}
