import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  type LiveRequestCardData,
  type LiveRequestUrgencyLevel,
  LiveRequestCard,
} from '@/components/shared/LiveRequestCard'

const baseRequest: LiveRequestCardData = {
  id: 'request-1',
  title: 'Ajutor urgent pentru medicamente',
  category: 'FACETOFACE',
  urgencyLevel: 'LOW',
  name: 'Ana Popescu',
}

const urgencyCases: Array<{
  urgencyLevel: LiveRequestUrgencyLevel
  label: string
  accentClassName: string
}> = [
  { urgencyLevel: 'LOW', label: 'Urgenta scazuta', accentClassName: 'bg-brand-green' },
  { urgencyLevel: 'MEDIUM', label: 'Urgenta medie', accentClassName: 'bg-brand-orange' },
  { urgencyLevel: 'HIGH', label: 'Urgenta ridicata', accentClassName: 'bg-brand-red/85' },
  { urgencyLevel: 'CRITICAL', label: 'Urgenta critica', accentClassName: 'bg-brand-red' },
]

function renderCard(request: LiveRequestCardData = baseRequest) {
  const view = render(<LiveRequestCard request={request} onClick={vi.fn()} />)
  const interactiveArea = screen.getByRole('button')
  const card = interactiveArea.closest('article')

  if (!(card instanceof HTMLElement)) {
    throw new Error('Card container was not rendered.')
  }

  const accentBar = card.querySelector('[aria-hidden="true"]')

  if (!(accentBar instanceof HTMLElement)) {
    throw new Error('Accent bar was not rendered.')
  }

  return { ...view, card, interactiveArea, accentBar }
}

describe('LiveRequestCard', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(urgencyCases)(
    'randeaza banda de culoare pentru urgenta $urgencyLevel',
    ({ urgencyLevel, label, accentClassName }) => {
      const { accentBar } = renderCard({ ...baseRequest, urgencyLevel })

      expect(screen.getByText(label)).toBeInTheDocument()
      expect(accentBar).toHaveClass(accentClassName)
    },
  )

  it('afiseaza fallback text pentru campurile lipsa', () => {
    renderCard({
      id: 'request-with-missing-fields',
      title: '',
      category: null,
      urgencyLevel: null,
      name: '   ',
    })

    expect(screen.getAllByText('Informație indisponibilă')).toHaveLength(4)
  })

  it('pastreaza clasele vizuale pentru hover pe card si continut', () => {
    const { card, accentBar } = renderCard()
    const title = screen.getByText('Ajutor urgent pentru medicamente')
    const urgencyLabel = screen.getByText('Urgenta scazuta')

    expect(card).toHaveClass('hover:border-brand-purple/35')
    expect(card).toHaveClass('hover:bg-white')
    expect(card.className).toContain('hover:shadow-')
    expect(title).toHaveClass('group-hover:text-brand-purple-dark')
    expect(urgencyLabel).toHaveClass('group-hover:text-brand-black/75')
    expect(accentBar).toHaveClass('group-hover:opacity-85')
  })

  it('permite actiuni in footer fara sa declanseze deschiderea cardului', async () => {
    const user = userEvent.setup()
    const onCardClick = vi.fn()
    const onActionClick = vi.fn()

    render(
      <LiveRequestCard
        footerActions={
          <button onClick={onActionClick} type="button">
            Anulează Cererea
          </button>
        }
        onClick={onCardClick}
        request={baseRequest}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Anulează Cererea' }))

    expect(onActionClick).toHaveBeenCalledTimes(1)
    expect(onCardClick).not.toHaveBeenCalled()
  })
})
