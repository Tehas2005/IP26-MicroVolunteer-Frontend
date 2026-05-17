const STORAGE_KEY = 'mvcr-guest-session-id'

type ResponseEnvelope<T> = {
  data?: T | null
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

export function getStoredGuestSessionId(): string | null {
  return normalizeSessionId(localStorage.getItem(STORAGE_KEY))
}

export function getGuestSessionId(): string {
  return getStoredGuestSessionId() ?? ''
}

export function storeGuestSessionId(sessionId: string) {
  localStorage.setItem(STORAGE_KEY, sessionId)
}

export function clearGuestSessionId() {
  localStorage.removeItem(STORAGE_KEY)
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
