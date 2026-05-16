export type RequestDetailsPayload = {
  notes: string
  languageNeeded: string
  safetyNotes: string
}

export function buildRequestDetailsPayload(
  notes: string,
  languageNeeded: string,
  safetyNotes: string,
): RequestDetailsPayload {
  return {
    notes: notes.trim(),
    languageNeeded: languageNeeded.trim(),
    safetyNotes: safetyNotes.trim(),
  }
}

export function hasRequestDetailsInput(requestDetails: RequestDetailsPayload) {
  return Boolean(
    requestDetails.notes || requestDetails.languageNeeded || requestDetails.safetyNotes,
  )
}
