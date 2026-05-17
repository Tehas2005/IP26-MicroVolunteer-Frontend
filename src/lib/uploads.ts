function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeString(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return ''
}

export function readUploadedAssetUrl(payload: unknown): string {
  const directValue = normalizeString(payload)

  if (directValue) {
    return directValue
  }

  if (!isRecord(payload)) {
    return ''
  }

  return normalizeString(payload.data)
}
