export function readHiddenIdentityFromResponse(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  if ('hiddenIdentity' in payload) {
    return Boolean(payload.hiddenIdentity)
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object') {
    const nestedPayload = payload.data as Record<string, unknown>

    if ('hiddenIdentity' in nestedPayload) {
      return Boolean(nestedPayload.hiddenIdentity)
    }
  }

  return false
}
