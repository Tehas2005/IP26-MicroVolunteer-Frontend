import { describe, expect, it } from 'vitest'

import {
  addKnownLocation,
  addSkillToList,
  readHiddenIdentityFromResponse,
  removeKnownLocation,
  validateMaxDistanceKm,
} from './volunteerProfileUtils'

describe('volunteerProfileUtils', () => {
  it('returns the exact validation message for zero or negative distances', () => {
    expect(validateMaxDistanceKm('-3')).toBe('Distanta trebuie sa fie un numar pozitiv')
    expect(validateMaxDistanceKm('0')).toBe('Distanta trebuie sa fie un numar pozitiv')
  })

  it('accepts positive decimal distances', () => {
    expect(validateMaxDistanceKm('12.5')).toBe('')
  })

  it('adds a known location only once and trims the values', () => {
    const withLocation = addKnownLocation([], ' Cluj-Napoca ', ' Strada Memorandumului ')
    const duplicated = addKnownLocation(
      withLocation,
      'cluj-napoca',
      'strada memorandumului',
    )

    expect(withLocation).toEqual([
      { city: 'Cluj-Napoca', address: 'Strada Memorandumului' },
    ])
    expect(duplicated).toBe(withLocation)
  })

  it('removes a known location by exact city and address', () => {
    expect(
      removeKnownLocation(
        [
          { city: 'Cluj-Napoca', address: 'Memorandumului 1' },
          { city: 'Iasi', address: 'Palas' },
        ],
        'Cluj-Napoca',
        'Memorandumului 1',
      ),
    ).toEqual([{ city: 'Iasi', address: 'Palas' }])
  })

  it('adds skills without duplicating values with different casing', () => {
    const nextSkills = addSkillToList(['Traducere'], ' traducere ')

    expect(nextSkills).toEqual(['Traducere'])
  })

  it('reads hiddenIdentity from both direct and nested payloads', () => {
    expect(readHiddenIdentityFromResponse({ hiddenIdentity: true })).toBe(true)
    expect(readHiddenIdentityFromResponse({ data: { hiddenIdentity: false } })).toBe(false)
  })
})
