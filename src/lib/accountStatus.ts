const RESTRICTED_ACCOUNT_STATUSES = new Set(['BLOCKED', 'INACTIVE'])

export const BLOCKED_LOGIN_MESSAGE = 'acest cont este suspendat. Nu te poti autentifica.'

export function normalizeAccountStatus(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim().toUpperCase()
  return normalizedValue || null
}

export function readAccountStatusFromUser(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const userRecord = payload as Record<string, unknown>
  return normalizeAccountStatus(userRecord.accountStatus ?? userRecord.accountstatus)
}

export function isRestrictedAccountStatus(status: unknown): boolean {
  const normalizedStatus = normalizeAccountStatus(status)
  return normalizedStatus ? RESTRICTED_ACCOUNT_STATUSES.has(normalizedStatus) : false
}

