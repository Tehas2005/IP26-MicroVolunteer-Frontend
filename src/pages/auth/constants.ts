export const STEP_LABELS = ['Cont', 'Profil', 'Identitate'] as const;

export const STEP_TITLES = [
  'Creează cont!',
  'Profilul tău',
  'Verificare identitate',
] as const;

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
