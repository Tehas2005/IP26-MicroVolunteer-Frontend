import type { IdMethod } from './types';

// ─── Opțiuni document de identitate ──────────────────────────────────────────

export const ID_METHODS: { value: IdMethod; label: string }[] = [
  { value: 'national_id',      label: 'CNP / ID Național' },
  { value: 'passport',         label: 'Pașaport' },
  { value: 'drivers_license',  label: 'Permis de conducere' },
];

export const ID_PLACEHOLDERS: Record<IdMethod, string> = {
  national_id:      '1234567890123',
  passport:         'AB1234567',
  drivers_license:  'B123456',
};

export const ID_MAX_LENGTHS: Record<IdMethod, number> = {
  national_id:      13,
  passport:         9,
  drivers_license:  20,
};

// ─── Pași înregistrare ────────────────────────────────────────────────────────

export const STEP_LABELS = ['Cont', 'Profil', 'Identitate'] as const;

export const STEP_TITLES = [
  'Creează cont!',
  'Profilul tău',
  'Verificare identitate',
] as const;

// ─── Stiluri refolosite (inline styles) ──────────────────────────────────────

export const inputStyle = (
  focused: boolean,
  hasError: boolean,
): React.CSSProperties => ({
  width: '100%',
  border: 'none',
  borderBottom: `1.5px solid ${hasError ? '#e53e3e' : focused ? '#7C3AED' : '#e2e8f0'}`,
  padding: '7px 0',
  fontSize: 14,
  color: '#1a1a1a',
  background: 'transparent',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
});

export const primaryButtonStyle = (
  loading: boolean,
): React.CSSProperties => ({
  width: '100%',
  height: 52,
  border: 'none',
  borderRadius: 12,
  marginTop: '1.5rem',
  background: loading ? '#ccc' : '#1a1a1a',
  color: 'white',
  fontSize: 16,
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
});