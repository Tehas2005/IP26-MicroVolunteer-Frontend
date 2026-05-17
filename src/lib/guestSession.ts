const STORAGE_KEY = 'mvcr-guest-session-id'
const SOURCE_STORAGE_KEY = 'mvcr-guest-session-source'

type GuestSessionEnvelope = {
  data?: {
    sessionId?: string | null
  } | null
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStoredGuestSessionId(): string | null {
  if (!canUseStorage()) {
    return null
  }

  const existing = window.localStorage.getItem(STORAGE_KEY)
  return typeof existing === 'string' && existing.trim() ? existing.trim() : null
}

function readStoredGuestSessionSource(): 'local' | 'server' | null {
  if (!canUseStorage()) {
    return null
  }

  const source = window.localStorage.getItem(SOURCE_STORAGE_KEY)
  return source === 'local' || source === 'server' ? source : null
}

function writeGuestSessionId(sessionId: string, source: 'local' | 'server') {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, sessionId)
  window.localStorage.setItem(SOURCE_STORAGE_KEY, source)
}

function createLocalGuestSessionId() {
  const id = crypto.randomUUID()
  writeGuestSessionId(id, 'local')
  return id
}

function extractGuestSessionId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = (payload as GuestSessionEnvelope).data

  if (!data || typeof data !== 'object') {
    return null
  }

  const sessionId = data.sessionId
  return typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null
}

export function getGuestSessionId(): string {
  const existing = readStoredGuestSessionId()

  if (existing) {
    return existing
  }

  return createLocalGuestSessionId()
}

export async function ensureGuestSessionId(): Promise<string> {
  const existing = readStoredGuestSessionId()
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
      writeGuestSessionId(sessionId, 'server')
      return sessionId
    }
  } catch {
    // Keep the local fallback so guest demo/mock flows remain usable offline.
  }

  return existing ?? createLocalGuestSessionId()
}
