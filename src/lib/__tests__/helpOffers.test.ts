import { describe, expect, it } from 'vitest'

import { mapOfferToHelpOffer, readOfferVolunteerId } from '@/lib/helpOffers'

describe('helpOffers helpers', () => {
  it('foloseste ratingul trimis direct de backend pe voluntar cand sumarul lipseste', () => {
    const mappedOffer = mapOfferToHelpOffer({
      offer: {
        id: 'offer-1',
        volunteerId: 12,
        message: 'Pot ajuta imediat.',
        status: 'PENDING',
        createdAt: '2026-05-17T08:00:00.000Z',
        volunteer: {
          name: 'Mara Ionescu',
          averageRating: '4.7',
        },
      },
      requestId: 'request-1',
    })

    expect(mappedOffer.volunteerName).toBe('Mara Ionescu')
    expect(mappedOffer.averageRating).toBe(4.7)
  })

  it('afiseaza lipsa ratingului cand backendul nu trimite nicio valoare', () => {
    const mappedOffer = mapOfferToHelpOffer({
      offer: {
        id: 'offer-2',
        volunteerId: 9,
        message: 'Sunt disponibil.',
        status: 'PENDING',
        volunteer: {
          username: 'voluntar_nou',
          averageRating: null,
        },
      },
      requestId: 'request-2',
    })

    expect(mappedOffer.averageRating).toBeNull()
  })

  it('prioritizeaza user id-ul voluntarului fata de id-ul intern de voluntar', () => {
    expect(
      readOfferVolunteerId({
        volunteerId: 21,
        volunteerUserId: 'user_abc123',
      }),
    ).toBe('user_abc123')
  })
})
