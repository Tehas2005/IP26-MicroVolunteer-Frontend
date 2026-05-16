import { describe, expect, it } from 'vitest'

import { readHiddenIdentityFromResponse } from '@/pages/profile/utils'

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
