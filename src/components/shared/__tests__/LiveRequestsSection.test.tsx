import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LiveRequestsSection } from '@/components/shared/LiveRequestsSection'

const myRequest = {
  id: 'mine-1',
  title: 'Cererea mea',
  category: 'FACETOFACE' as const,
  urgencyLevel: 'LOW' as const,
  name: 'Ion Socol',
}

const volunteerRequest = {
  id: 'volunteer-1',
  title: 'Cerere voluntar',
  category: 'MESSAGES_ONLY' as const,
  urgencyLevel: 'CRITICAL' as const,
  username: 'utilizator_anonim',
  anonymousMode: true,
}

describe('LiveRequestsSection', () => {
  afterEach(() => {
    cleanup()
  })

  it('afiseaza empty state-ul cand tabul activ nu are cereri', () => {
    render(<LiveRequestsSection myRequests={[]} volunteerRequests={[]} />)

    expect(screen.getByText('Momentan nu există cereri live în zona ta.')).toBeInTheDocument()
  })

  it('schimba taburile corect si afiseaza cererile tabului selectat', async () => {
    const user = userEvent.setup()

    render(
      <LiveRequestsSection
        myRequests={[myRequest]}
        volunteerRequests={[volunteerRequest]}
      />,
    )

    expect(screen.getByText('Cererea mea')).toBeInTheDocument()
    expect(screen.queryByText('Cerere voluntar')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Feed Voluntar' }))

    expect(screen.getByText('Cerere voluntar')).toBeInTheDocument()
    expect(screen.queryByText('Cererea mea')).not.toBeInTheDocument()
  })

  it('apeleaza callback-ul cand se deschide o cerere din feed-ul de voluntar', async () => {
    const user = userEvent.setup()
    const openVolunteerRequest = vi.fn()

    render(
      <LiveRequestsSection
        myRequests={[myRequest]}
        onVolunteerRequestOpen={openVolunteerRequest}
        volunteerRequests={[volunteerRequest]}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Feed Voluntar' }))
    await user.click(screen.getByRole('button', { name: /cerere voluntar/i }))

    expect(openVolunteerRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'volunteer-1', title: 'Cerere voluntar' }),
    )
  })
})
