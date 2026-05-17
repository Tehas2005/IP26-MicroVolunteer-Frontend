import { describe, expect, it } from 'vitest'

import {
  BLOCKED_LOGIN_MESSAGE,
  isRestrictedAccountStatus,
  normalizeAccountStatus,
  readAccountStatusFromUser,
} from './accountStatus'

describe('accountStatus helpers', () => {
  it('normalizeaza statusurile indiferent de casing', () => {
    expect(normalizeAccountStatus(' blocked ')).toBe('BLOCKED')
    expect(normalizeAccountStatus('InAcTiVe')).toBe('INACTIVE')
  })

  it('citeste atat accountStatus, cat si accountstatus', () => {
    expect(readAccountStatusFromUser({ accountStatus: 'blocked' })).toBe('BLOCKED')
    expect(readAccountStatusFromUser({ accountstatus: 'inactive' })).toBe('INACTIVE')
  })

  it('marcheaza doar BLOCKED si INACTIVE drept statusuri restrictionate', () => {
    expect(isRestrictedAccountStatus('BLOCKED')).toBe(true)
    expect(isRestrictedAccountStatus('inactive')).toBe(true)
    expect(isRestrictedAccountStatus('ACTIVE')).toBe(false)
    expect(isRestrictedAccountStatus('LIMITED')).toBe(false)
  })

  it('expune mesajul de eroare cerut pentru login blocat', () => {
    expect(BLOCKED_LOGIN_MESSAGE).toBe('acest cont este suspendat. Nu te poti autentifica.')
  })
})
