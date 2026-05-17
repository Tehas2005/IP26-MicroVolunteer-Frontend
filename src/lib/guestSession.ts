const STORAGE_KEY = 'mvcr-guest-session-id'
const SOURCE_STORAGE_KEY = 'mvcr-guest-session-source'

type ResponseEnvelope<T> = {
  data?: T | null
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readEnvelopeData<T>(payload: unknown): T | null {
  if (!isRecord(payload) || !('data' in payload)) {
    return null
  }

  return (payload as ResponseEnvelope<T>).data ?? null
}

function normalizeSessionId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readStoredGuestSessionSource(): 'local' | 'server' | null {
  if (!canUseStorage()) {
    return null
  }

  const source = window.localStorage.getItem(SOURCE_STORAGE_KEY)
  return source === 'local' || source === 'server' ? source : null
}

export function getStoredGuestSessionId(): string | null {
  if (!canUseStorage()) {
    return null
  }

  return normalizeSessionId(window.localStorage.getItem(STORAGE_KEY))
}

export function storeGuestSessionId(sessionId: string, source: 'local' | 'server' = 'server') {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, sessionId)
  window.localStorage.setItem(SOURCE_STORAGE_KEY, source)
}

export function clearGuestSessionId() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(SOURCE_STORAGE_KEY)
}

function createLocalGuestSessionId() {
  const sessionId = crypto.randomUUID()
  storeGuestSessionId(sessionId, 'local')
  return sessionId
}

export function getGuestSessionId(): string {
  return getStoredGuestSessionId() ?? createLocalGuestSessionId()
}

export function extractGuestSessionId(payload: unknown): string | null {
  if (isRecord(payload)) {
    const directSessionId = normalizeSessionId(payload.sessionId)

    if (directSessionId) {
      return directSessionId
    }
  }

  const sessionPayload = readEnvelopeData<unknown>(payload)

  if (!isRecord(sessionPayload)) {
    return null
  }

  return normalizeSessionId(sessionPayload.sessionId)
}

export async function ensureGuestSessionId(): Promise<string> {
  const existing = getStoredGuestSessionId()
  const source = readStoredGuestSessionSource()

  if (existing && source === 'server') {
    return existing
  }

  try {
    const response = await fetch('/api/guest/session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const payload = (await response.json().catch(() => null)) as unknown
    const sessionId = response.ok ? extractGuestSessionId(payload) : null

    if (sessionId) {
      storeGuestSessionId(sessionId, 'server')
      return sessionId
    }
  } catch {
    // Preserve the local fallback so guest flows still work if backend session bootstrap fails.
  }

  return existing ?? createLocalGuestSessionId()
}
