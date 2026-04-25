import type { AuthMode } from './types';

type Props = {
  mode: AuthMode;
};

export function SuccessScreen({ mode }: Props) {
  const isRegister = mode === 'register';

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: '50%',
          background: isRegister ? 'rgba(94, 149, 98, 0.12)' : '#f0fdf4',
          border: isRegister ? '2px solid rgba(94, 149, 98, 0.3)' : '2px solid #86efac',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', fontSize: 28,
          color: isRegister ? '#5e9562' : 'inherit',
        }}
      >
        ✓
      </div>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
        {isRegister ? 'Verificare reușită!' : 'Bun venit înapoi!'}
      </h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 1.5rem' }}>
        {isRegister
          ? 'Contul tău a fost verificat cu succes. Poți acum să folosești toate funcționalitățile platformei.'
          : 'Se pregătește dashboard-ul tău...'}
      </p>
      <div
        style={{
          height: 3, borderRadius: 2,
          background: '#f0f0f0',
          maxWidth: 180, margin: '0 auto', overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%', background: '#7C3AED',
            animation: 'mv-progress 2.5s linear forwards',
          }}
        />
      </div>
    </div>
  );
}
