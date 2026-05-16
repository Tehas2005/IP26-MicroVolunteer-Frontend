import { describe, expect, it } from 'vitest'

import { addSkillToList, readHiddenIdentityFromResponse } from '@/pages/profile/utils'

describe('readHiddenIdentityFromResponse', () => {
  it('citeste hiddenIdentity de pe primul nivel al raspunsului', () => {
    expect(readHiddenIdentityFromResponse({ hiddenIdentity: true })).toBe(true)
  })

  it('citeste hiddenIdentity din campul data', () => {
    expect(readHiddenIdentityFromResponse({ data: { hiddenIdentity: true } })).toBe(true)
  })

  it('returneaza false pentru payload invalid', () => {
    expect(readHiddenIdentityFromResponse(null)).toBe(false)
  })
})

describe('addSkillToList', () => {
  it('adauga un skill valid dupa ce elimina spatiile inutile', () => {
    expect(addSkillToList(['transport'], '  traducere  ')).toEqual(['transport', 'traducere'])
  })

  it('ignora skill-urile goale', () => {
    const currentSkills = ['transport']

    expect(addSkillToList(currentSkills, '   ')).toBe(currentSkills)
  })

  it('nu adauga duplicate case-insensitive', () => {
    const currentSkills = ['transport']

    expect(addSkillToList(currentSkills, 'Transport')).toBe(currentSkills)
  })
})
