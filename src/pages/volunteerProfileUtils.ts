export type KnownLocationEntry = {
  city: string
  address: string
}

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

export function addSkillToList(currentSkills: string[], rawSkill: string): string[] {
  const normalizedSkill = rawSkill.trim()

  if (!normalizedSkill) {
    return currentSkills
  }

  const alreadyExists = currentSkills.some(
    (existingSkill) => existingSkill.toLowerCase() === normalizedSkill.toLowerCase(),
  )

  if (alreadyExists) {
    return currentSkills
  }

  return [...currentSkills, normalizedSkill]
}

export function validateMaxDistanceKm(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  const parsedValue = Number(normalizedValue)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 'Distanta trebuie sa fie un numar pozitiv'
  }

  return ''
}

export function addKnownLocation(
  currentLocations: KnownLocationEntry[],
  city: string,
  address: string,
): KnownLocationEntry[] {
  const normalizedCity = city.trim()
  const normalizedAddress = address.trim()

  if (!normalizedCity || !normalizedAddress) {
    return currentLocations
  }

  const duplicateExists = currentLocations.some(
    (entry) =>
      entry.city.toLowerCase() === normalizedCity.toLowerCase() &&
      entry.address.toLowerCase() === normalizedAddress.toLowerCase(),
  )

  if (duplicateExists) {
    return currentLocations
  }

  return [...currentLocations, { city: normalizedCity, address: normalizedAddress }]
}

export function removeKnownLocation(
  currentLocations: KnownLocationEntry[],
  city: string,
  address: string,
) {
  return currentLocations.filter(
    (entry) => !(entry.city === city && entry.address === address),
  )
}
