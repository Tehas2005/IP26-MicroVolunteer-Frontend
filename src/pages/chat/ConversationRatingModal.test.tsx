import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConversationRatingModal } from './ConversationRatingModal'

describe('ConversationRatingModal', () => {
  it('afiseaza titlul pentru utilizatorul care a cerut ajutor', () => {
    render(
      <ConversationRatingModal
        isOpen
        targetName="Ana"
        targetUserId="user:ana"
        viewerRole="requester"
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Evalueaza ajutorul primit de la Ana')).toBeInTheDocument()
  })

  it('afiseaza eroare daca submit-ul este facut fara stea selectata', () => {
    render(
      <ConversationRatingModal
        isOpen
        targetName="Ana"
        targetUserId="user:ana"
        viewerRole="volunteer"
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trimite Evaluarea' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Te rugam sa acorzi cel putin o stea')
  })

  it('trimite rating-ul selectat impreuna cu targetUserId', () => {
    const handleSubmit = vi.fn()

    render(
      <ConversationRatingModal
        isOpen
        targetName="Ana"
        targetUserId="user:ana"
        viewerRole="volunteer"
        onSkip={vi.fn()}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '4 stele' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trimite Evaluarea' }))

    expect(handleSubmit).toHaveBeenCalledWith(4, 'user:ana')
  })
})
