import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import VolunteerNotificationStack from '@/components/shared/VolunteerNotificationStack'
import type { LiveRequestCardData } from '@/components/shared/LiveRequestCard'
import type { VolunteerNotificationItem } from '@/lib/volunteerNotifications'
import { createVolunteerNotification } from '@/lib/volunteerNotifications'

function createNotificationOverrides(
  overrides?: Partial<VolunteerNotificationItem['request']>,
): VolunteerNotificationItem {
  return createVolunteerNotification({
    id: overrides?.id ?? 'request-1',
    title: overrides?.title ?? 'Ridicare medicamente de la farmacie',
    description:
      overrides?.description ??
      'O persoana in varsta are nevoie de ajutor rapid pentru ridicarea tratamentului prescris.',
    urgencyLevel: overrides?.urgencyLevel ?? 'HIGH',
    city: overrides?.city ?? 'Cluj-Napoca',
    skillsNeeded: overrides?.skillsNeeded ?? ['transport'],
  })
}

function NotificationsHarness({
  initialNotifications,
  autoDismissMs = 9000,
  onViewDetails = () => {},
}: {
  initialNotifications: VolunteerNotificationItem[]
  autoDismissMs?: number
  onViewDetails?: (request: LiveRequestCardData) => void
}) {
  const [notifications, setNotifications] = useState(initialNotifications)

  return (
    <VolunteerNotificationStack
      autoDismissMs={autoDismissMs}
      notifications={notifications}
      onDismiss={(notificationId) =>
        setNotifications((currentNotifications) =>
          currentNotifications.filter((notification) => notification.id !== notificationId),
        )
      }
      onViewDetails={onViewDetails}
    />
  )
}

describe('VolunteerNotificationStack', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('randeaza titlul alertei, mesajul extras si notificarile stivuite', () => {
    const firstNotification = createNotificationOverrides({
      id: 'request-1',
      description: 'Solicitantul are nevoie de ajutor rapid pentru a ajunge la farmacie.',
    })
    const secondNotification = createNotificationOverrides({
      id: 'request-2',
      title: 'Traducere rapida prin mesaje',
      description: 'Este nevoie de traducerea unui mesaj medical in aceasta seara.',
      urgencyLevel: 'MEDIUM',
      city: 'Iasi',
      skillsNeeded: ['traducere', 'suport emotional'],
    })

    render(
      <NotificationsHarness initialNotifications={[firstNotification, secondNotification]} />,
    )

    expect(screen.getByText('Noua cerere urgenta!')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Solicitantul are nevoie de ajutor rapid pentru a ajunge la farmacie. Zona: Cluj-Napoca Skill-uri: transport',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Cerere compatibila noua')).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  it('elimina imediat notificarea din DOM cand utilizatorul apasa pe X', async () => {
    const user = userEvent.setup()

    render(
      <NotificationsHarness initialNotifications={[createNotificationOverrides()]} />,
    )

    expect(screen.getByTestId('volunteer-toast-request-1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Inchide alerta/i }))

    expect(screen.queryByTestId('volunteer-toast-request-1')).not.toBeInTheDocument()
  })

  it('elimina automat notificarea dupa timeoutul configurat', () => {
    vi.useFakeTimers()

    render(
      <NotificationsHarness
        autoDismissMs={8000}
        initialNotifications={[createNotificationOverrides()]}
      />,
    )

    expect(screen.getByTestId('volunteer-toast-request-1')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.queryByTestId('volunteer-toast-request-1')).not.toBeInTheDocument()
  })
})
