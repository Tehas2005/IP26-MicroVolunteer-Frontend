const STORAGE_KEY = 'mvcr-guest-request-limit'
export const DEFAULT_GUEST_REQUEST_LIMIT = 3

function normalizeLimit(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_GUEST_REQUEST_LIMIT
  }

  return Math.max(0, Math.floor(value))
}

export function getGuestRequestLimit(): number {
  const rawValue = localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_GUEST_REQUEST_LIMIT))
    return DEFAULT_GUEST_REQUEST_LIMIT
  }

  const parsedValue = Number(rawValue)
  const normalizedLimit = normalizeLimit(parsedValue)

  if (String(normalizedLimit) !== rawValue) {
    localStorage.setItem(STORAGE_KEY, String(normalizedLimit))
  }

  return normalizedLimit
}

export function setGuestRequestLimit(limit: number): number {
  const normalizedLimit = normalizeLimit(limit)
  localStorage.setItem(STORAGE_KEY, String(normalizedLimit))

  return normalizedLimit
}

export function decrementGuestRequestLimit(): number {
  return setGuestRequestLimit(getGuestRequestLimit() - 1)
}
