import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HelpOffersInboxDialog } from '@/components/shared/HelpOffersInboxDialog'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import type { HelpOfferData } from '@/lib/mockHelpOffers'

const request: LiveRequestCardData = {
  id: 'request-1',
  title: 'Am nevoie de ajutor pentru completarea unor formulare',
  category: 'MESSAGES_ONLY',
  requesterKind: 'user',
  supportingText: '3 oferte primite. Apasă pentru a decide.',
}

const offers: HelpOfferData[] = [
  {
    id: 'offer-1',
    requestId: 'request-1',
    volunteerKey: 'volunteer-1',
    volunteerName: 'Ilinca Pop',
    averageRating: 4.9,
    createdAt: new Date().toISOString(),
    message: 'Pot răspunde imediat și te pot ghida pas cu pas.',
    status: 'rejected',
  },
  {
    id: 'offer-2',
    requestId: 'request-1',
    volunteerKey: 'volunteer-2',
    volunteerName: 'Mara Ionescu',
    averageRating: 5,
    createdAt: new Date().toISOString(),
    message: 'Rămân cu tine în chat până terminăm cererea.',
    status: 'accepted',
  },
]

describe('HelpOffersInboxDialog', () => {
  it('pastreaza zona cu oferte scrollabila cand header-ul devine mai inalt', () => {
    render(
      <HelpOffersInboxDialog
        offers={offers}
        onAccept={vi.fn()}
        onOpenChange={vi.fn()}
        onReject={vi.fn()}
        open
        request={request}
      />,
    )

    const scrollArea = screen.getByTestId('help-offers-scroll-area')

    expect(scrollArea).toHaveClass('min-h-0')
    expect(scrollArea).toHaveClass('flex-1')
    expect(scrollArea).toHaveClass('overflow-y-auto')
    expect(screen.getByRole('button', { name: 'Refuzată' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acceptată' })).toBeInTheDocument()
  })
})
