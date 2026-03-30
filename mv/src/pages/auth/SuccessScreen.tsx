import type { AuthMode } from '../auth/types';

type Props = {
  mode: AuthMode;
};

/**
 * Ecranul afișat după autentificare sau înregistrare reușită.
 * Include o bară de progres animată înainte de redirecționarea spre dashboard.
 */
export function SuccessScreen({ mode }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#f0fdf4', border: '2px solid #86efac',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', fontSize: 28,
        }}
      >
        ✓
      </div>
      <h2 style={{ margin: '0 0 0.5rem', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
        {mode === 'register' ? 'Cont creat!' : 'Bun venit înapoi!'}
      </h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 1.5rem' }}>
        Se pregătește dashboard-ul tău...
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