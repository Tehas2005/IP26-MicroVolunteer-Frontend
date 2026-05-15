import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AcceptVolunteerModal } from './AcceptVolunteerModal'

function deferred() {
  let resolve!: () => void

  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve
  })

  return { promise, resolve }
}

describe('AcceptVolunteerModal', () => {
  it('does not render when closed', () => {
    render(
      <AcceptVolunteerModal
        averageRating={4.8}
        isOpen={false}
        onAccept={() => undefined}
        onDecline={() => undefined}
        volunteerName="Ana"
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders volunteer score and overlay', () => {
    render(
      <AcceptVolunteerModal
        averageRating={4.8}
        isOpen
        onAccept={() => undefined}
        onDecline={() => undefined}
        volunteerName="Ana"
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Un voluntar vrea sa te ajute!')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByTestId('accept-volunteer-overlay')).toHaveClass('bg-black/70')
  })

  it('falls back to anonymous volunteer name when name is empty', () => {
    render(
      <AcceptVolunteerModal
        averageRating={3.2}
        isOpen
        onAccept={() => undefined}
        onDecline={() => undefined}
        volunteerName="   "
      />,
    )

    expect(screen.getByText('Voluntar anonim')).toBeInTheDocument()
  })

  it('shows loading state and disables both buttons during accept', async () => {
    const action = deferred()
    const onAccept = vi.fn(() => action.promise)
    const onDecline = vi.fn()
    const user = userEvent.setup()

    render(
      <AcceptVolunteerModal
        averageRating={4.4}
        isOpen
        onAccept={onAccept}
        onDecline={onDecline}
        volunteerName="Mara"
      />,
    )

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

    render(
      <AcceptVolunteerModal
        averageRating={4.1}
        isOpen
        onAccept={onAccept}
        onDecline={onDecline}
        volunteerName="Paul"
      />,
    )

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
})
