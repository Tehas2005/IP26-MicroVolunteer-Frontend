import { useEffect, useRef, useState, type FormEvent } from 'react'

import { useAuthStore } from '@/store/authStore'

const askForHelpStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .ask-help-page {
    color: #111827;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .ask-help-form-container {
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    padding: 40px 16px;
    min-height: calc(100vh - 148px);
  }

  .ask-help-card {
    background-color: #ffffff;
    border-radius: 24px;
    padding: 40px;
    max-width: 650px;
    margin: 0 auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  }

  .ask-help-header-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .ask-help-header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 32px 0;
  }

  .ask-help-field-group {
    margin-bottom: 28px;
  }

  .ask-help-field-label {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    display: block;
  }

  .ask-help-required-asterisk {
    color: #ef4444;
  }

  .ask-help-text-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .ask-help-text-input:focus {
    border-color: #7c3aed;
  }

  .ask-help-text-input::placeholder {
    color: #9ca3af;
  }

  .ask-help-toggle-grid {
    display: flex;
    gap: 16px;
  }

  .ask-help-toggle-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background-color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ask-help-toggle-btn:hover:not(:disabled) {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }

  .ask-help-toggle-btn.ask-help-active {
    border-color: #7c3aed;
    background-color: #f5f3ff;
    color: #6d28d9;
  }

  .ask-help-toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }

  .ask-help-urgency-verde.ask-help-active {
    border-color: #10b981;
    background-color: #ecfdf5;
    color: #047857;
  }

  .ask-help-urgency-galben.ask-help-active {
    border-color: #f59e0b;
    background-color: #fffbeb;
    color: #b45309;
  }

  .ask-help-urgency-rosu.ask-help-active {
    border-color: #ef4444;
    background-color: #fef2f2;
    color: #b91c1c;
  }

  .ask-help-error-text {
    color: #ef4444;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 600;
  }

  .ask-help-success-box {
    background-color: #dcfce7;
    color: #166534;
    padding: 16px;
    border-radius: 12px;
    margin-top: 24px;
    text-align: center;
    font-weight: 700;
    border: 1px solid #bbf7d0;
  }

  .ask-help-primary-submit-btn {
    background-color: #1a1a1a;
    color: #ffffff;
    border-radius: 12px;
    padding: 16px;
    border: none;
    width: 100%;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
    position: relative;
    overflow: hidden;
    background-size: 200% auto;
  }

  .ask-help-primary-submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .ask-help-primary-submit-btn.ask-help-submitting {
    background-image: linear-gradient(90deg, #1a1a1a 0%, #7c3aed 50%, #1a1a1a 100%);
    animation: ask-help-pulse-gradient 1.5s linear infinite;
    pointer-events: none;
    color: #fff;
  }

  @keyframes ask-help-pulse-gradient {
    0% {
      background-position: 0% center;
    }

    100% {
      background-position: 200% center;
    }
  }

  @media (max-width: 768px) {
    .ask-help-form-container {
      padding: 24px 16px;
    }

    .ask-help-card {
      padding: 28px 20px;
      border-radius: 20px;
    }

    .ask-help-toggle-grid {
      flex-direction: column;
    }
  }
`

function InformatiiSuplimentare() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div
      className="ask-help-field-group"
      style={{ borderTop: '1px solid #e5e7eb', paddingTop: '28px', marginTop: '12px' }}
    >
      <label className="ask-help-field-label">Descriere detaliată a situației</label>
      <textarea
        ref={textareaRef}
        className="ask-help-text-input"
        placeholder="Oferă mai multe detalii despre cum te putem ajuta..."
        rows={3}
        onInput={handleInput}
        style={{ resize: 'none', overflow: 'hidden', minHeight: '80px' }}
      />
    </div>
  )
}

export function AskForHelpPage() {
  const authIsGuest = useAuthStore((state) => state.isGuest)
  const [isGuest, setIsGuest] = useState(true)
  const [titlu, setTitlu] = useState('')
  const [requestType, setRequestType] = useState<'Online' | 'Fizic'>('Online')
  const [urgency, setUrgency] = useState<'Verde' | 'Galben' | 'Roșu'>('Verde')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsGuest(authIsGuest)
  }, [authIsGuest])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (isGuest && requestType === 'Fizic') {
      setError('Vizitatorii pot face doar cereri online. Autentifică-te pentru acces complet.')
      return
    }

    const payload = {
      isGuest,
      titlu,
      requestType,
      urgency: isGuest ? null : urgency,
    }

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log('JSON pregătit:', JSON.stringify(payload))
      setSuccessMessage('Cererea ta a fost trimisă voluntarilor!')
      setTitlu('')
      setRequestType('Online')
      setUrgency('Verde')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="ask-help-page bg-brand-cream">
      <style>{askForHelpStyles}</style>

      <div className="ask-help-form-container">
        <main className="ask-help-card">
          <h1 className="ask-help-header-title">Solicitare Ajutor</h1>
          <p className="ask-help-header-subtitle">
            Completează detaliile de bază pentru cererea ta.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Titlul cererii <span className="ask-help-required-asterisk">*</span>
              </label>
              <input
                type="text"
                className="ask-help-text-input"
                placeholder="Ex: Ridicare medicamente de la farmacie"
                value={titlu}
                onChange={(event) => setTitlu(event.target.value)}
                required
              />
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Tipul cererii <span className="ask-help-required-asterisk">*</span>
              </label>
              <div className="ask-help-toggle-grid">
                <button
                  type="button"
                  className={`ask-help-toggle-btn ${requestType === 'Fizic' ? 'ask-help-active' : ''}`}
                  onClick={() => setRequestType('Fizic')}
                  disabled={isGuest}
                >
                  📍 Fizic {isGuest && '🔒'}
                </button>

                <button
                  type="button"
                  className={`ask-help-toggle-btn ${requestType === 'Online' ? 'ask-help-active' : ''}`}
                  onClick={() => setRequestType('Online')}
                >
                  🌐 Online
                </button>
              </div>
              {error && <div className="ask-help-error-text">{error}</div>}
            </div>

            <div className="ask-help-field-group">
              <label className="ask-help-field-label">
                Nivel de urgență <span className="ask-help-required-asterisk">*</span>
              </label>
              <div className="ask-help-toggle-grid">
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-verde ${urgency === 'Verde' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Verde')}
                >
                  Verde
                </button>
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-galben ${urgency === 'Galben' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Galben')}
                >
                  Galben
                </button>
                <button
                  type="button"
                  className={`ask-help-toggle-btn ask-help-urgency-rosu ${urgency === 'Roșu' ? 'ask-help-active' : ''}`}
                  onClick={() => setUrgency('Roșu')}
                  disabled={isGuest}
                >
                  Roșu {isGuest && '🔒'}
                </button>
              </div>
            </div>

            {!isGuest && <InformatiiSuplimentare />}

            <button
              type="submit"
              className={`ask-help-primary-submit-btn ${isSubmitting ? 'ask-help-submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Se trimite...' : 'Trimite Cererea'}
            </button>

            {successMessage && <div className="ask-help-success-box">{successMessage}</div>}
          </form>
        </main>
      </div>
    </section>
  )
}

export default AskForHelpPage
