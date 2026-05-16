const STORAGE_KEY = 'mvcr-guest-session-id'

export function readGuestSessionId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  return existing?.trim() || ''
}

export function getGuestSessionId(): string {
  const existing = readGuestSessionId()
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}

export function setGuestSessionId(sessionId: string) {
  if (!sessionId.trim()) {
    return
  }

  localStorage.setItem(STORAGE_KEY, sessionId.trim())
}
