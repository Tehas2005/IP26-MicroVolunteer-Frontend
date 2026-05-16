import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AcceptVolunteerModal, type AcceptVolunteerModalProps } from './AcceptVolunteerModal'

function deferred() {
  let resolve!: () => void

  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve
  })

  return { promise, resolve }
}

describe('AcceptVolunteerModal', () => {
  function renderModal(overrides: Partial<AcceptVolunteerModalProps> = {}) {
    const props: AcceptVolunteerModalProps = {
      averageRating: 4.8,
      isOpen: true,
      onAccept: () => undefined,
      onClose: () => undefined,
      onDecline: () => undefined,
      volunteerName: 'Ana',
      ...overrides,
    }

    return render(<AcceptVolunteerModal {...props} />)
  }

  it('does not render when closed', () => {
    renderModal({ isOpen: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders volunteer score and overlay', () => {
    renderModal()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Un voluntar vrea sa te ajute!')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByTestId('accept-volunteer-overlay')).toHaveClass('bg-black/70')
  })

  it('falls back to anonymous volunteer name when name is empty', () => {
    renderModal({ averageRating: 3.2, volunteerName: '   ' })

    expect(screen.getByText('Voluntar anonim')).toBeInTheDocument()
  })

  it('shows loading state and disables both buttons during accept', async () => {
    const action = deferred()
    const onAccept = vi.fn(() => action.promise)
    const onDecline = vi.fn()
    const user = userEvent.setup()

    renderModal({ averageRating: 4.4, onAccept, onDecline, volunteerName: 'Mara' })

    await user.click(screen.getByRole('button', { name: 'Accepta ajutorul' }))

    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Se confirma/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Refuza' })).toBeDisabled()

    action.resolve()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accepta ajutorul' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Refuza' })).toBeEnabled()
    })
  })

  it('shows loading state and disables both buttons during decline', async () => {
    const action = deferred()
    const onAccept = vi.fn()
    const onDecline = vi.fn(() => action.promise)
    const user = userEvent.setup()

    renderModal({ averageRating: 4.1, onAccept, onDecline, volunteerName: 'Paul' })

    await user.click(screen.getByRole('button', { name: 'Refuza' }))

    expect(onDecline).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Se refuza/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Se refuza/i })).toBeDisabled()

    action.resolve()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accepta ajutorul' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Refuza' })).toBeEnabled()
    })
  })

  it('resets loading state after modal closes and reopens', async () => {
    const action = deferred()
    const user = userEvent.setup()
    const onAccept = vi.fn(() => action.promise)
    const onDecline = vi.fn()

    const { rerender } = renderModal({ averageRating: 4.6, onAccept, onDecline, volunteerName: 'Elena' })

    await user.click(screen.getByRole('button', { name: 'Accepta ajutorul' }))
    expect(screen.getByRole('button', { name: /Se confirma/i })).toBeDisabled()

    rerender(
      <AcceptVolunteerModal
        averageRating={4.6}
        isOpen={false}
        onAccept={onAccept}
        onClose={() => undefined}
        onDecline={onDecline}
        volunteerName="Elena"
      />,
    )

    rerender(
      <AcceptVolunteerModal
        averageRating={4.6}
        isOpen
        onAccept={onAccept}
        onClose={() => undefined}
        onDecline={onDecline}
        volunteerName="Elena"
      />,
    )

    expect(screen.getByRole('button', { name: 'Accepta ajutorul' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Refuza' })).toBeEnabled()

    action.resolve()
  })

  it('resets loading state when modal switches to another volunteer', async () => {
    const action = deferred()
    const user = userEvent.setup()
    const onAccept = vi.fn(() => action.promise)
    const onDecline = vi.fn()

    const { rerender } = renderModal({ averageRating: 4.2, onAccept, onDecline, volunteerName: 'Ioana' })

    await user.click(screen.getByRole('button', { name: 'Accepta ajutorul' }))
    expect(screen.getByRole('button', { name: /Se confirma/i })).toBeDisabled()

    rerender(
      <AcceptVolunteerModal
        averageRating={5}
        isOpen
        onAccept={onAccept}
        onClose={() => undefined}
        onDecline={onDecline}
        volunteerName="Matei"
      />,
    )

    expect(screen.getByText('Matei')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accepta ajutorul' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Refuza' })).toBeEnabled()

    action.resolve()
  })

  it('clamps invalid ratings into the 0 to 5 range', () => {
    const { rerender } = renderModal({ averageRating: 7.4 })

    expect(screen.getByText('5.0')).toBeInTheDocument()

    rerender(
      <AcceptVolunteerModal
        averageRating={-2}
        isOpen
        onAccept={() => undefined}
        onClose={() => undefined}
        onDecline={() => undefined}
        volunteerName="Ana"
      />,
    )

    expect(screen.getByText('0.0')).toBeInTheDocument()
  })

  it('closes on Escape when no action is pending', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderModal({ onClose })

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
