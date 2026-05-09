const STORAGE_KEY = 'mvcr-guest-session-id'

export function getGuestSessionId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
