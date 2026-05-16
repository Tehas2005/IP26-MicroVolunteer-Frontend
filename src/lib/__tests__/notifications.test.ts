import { describe, expect, it } from 'vitest'

import {
  extractNotificationPayload,
  readNotificationId,
  readNotificationTaskId,
  readNotificationText,
  readNotificationType,
} from '@/lib/notifications'

describe('notification helpers', () => {
  it('extrage notificarea din payload-ul websocket al backendului', () => {
    const notification = extractNotificationPayload(
      JSON.stringify({
        type: 'NOTIFICATION',
        data: {
          id: 17,
          type: 'OFFER_ACCEPTED',
          text: 'Cererea ta a fost acceptata.',
          relatedRequestId: 42,
        },
      }),
    )

    expect(notification).not.toBeNull()
    expect(readNotificationId(notification!)).toBe('17')
    expect(readNotificationType(notification!)).toBe('OFFER_ACCEPTED')
    expect(readNotificationTaskId(notification!)).toBe('42')
    expect(readNotificationText(notification!)).toBe('Cererea ta a fost acceptata.')
  })

  it('returneaza null pentru payload invalid', () => {
    expect(extractNotificationPayload('not-json')).toBeNull()
    expect(extractNotificationPayload({ type: 'PING' })).toBeNull()
  })
})
