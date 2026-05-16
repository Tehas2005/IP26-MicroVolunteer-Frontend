import { useEffect } from 'react'
import { BellRing, MapPin, Sparkles, X } from 'lucide-react'

import type { VolunteerNotificationItem } from '@/lib/volunteerNotifications'

import { Button } from '@/components/ui/button'

import type { LiveRequestCardData } from './LiveRequestCard'

export interface VolunteerNotificationStackProps {
  notifications: VolunteerNotificationItem[]
  autoDismissMs?: number
  onDismiss: (notificationId: string) => void
  onViewDetails: (request: LiveRequestCardData) => void
}

interface VolunteerNotificationToastProps {
  notification: VolunteerNotificationItem
  autoDismissMs: number
  onDismiss: (notificationId: string) => void
  onViewDetails: (request: LiveRequestCardData) => void
}

function VolunteerNotificationToast({
  notification,
  autoDismissMs,
  onDismiss,
  onViewDetails,
}: VolunteerNotificationToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(notification.id)
    }, autoDismissMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [autoDismissMs, notification.id, onDismiss])

  return (
    <article
      aria-atomic="true"
      aria-live="polite"
      className="volunteer-notification-enter pointer-events-auto rounded-[24px] border border-brand-purple/20 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
      data-testid={`volunteer-toast-${notification.request.id}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple-dark">
          <BellRing className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-black">{notification.title}</p>
              <p className="mt-1 text-sm leading-6 text-brand-gray-text">{notification.message}</p>
            </div>

            <button
              aria-label={`Inchide alerta pentru ${notification.request.title ?? 'cererea noua'}`}
              className="rounded-full p-1.5 text-brand-gray-text transition hover:bg-brand-cream hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
              onClick={() => onDismiss(notification.id)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          {notification.request.city || notification.request.skillsNeeded?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {notification.request.city ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-2.5 py-1 text-xs font-medium text-brand-black">
                  <MapPin className="size-3.5" />
                  {notification.request.city}
                </span>
              ) : null}

              {notification.request.skillsNeeded?.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-purple-light px-2.5 py-1 text-xs font-medium text-brand-purple-dark">
                  <Sparkles className="size-3.5" />
                  {notification.request.skillsNeeded.join(', ')}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => onViewDetails(notification.request)}
              size="sm"
              variant="auth"
            >
              Vezi detalii
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function VolunteerNotificationStack({
  notifications,
  autoDismissMs = 9000,
  onDismiss,
  onViewDetails,
}: VolunteerNotificationStackProps) {
  if (notifications.length === 0) {
    return null
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-24 sm:w-full sm:max-w-sm">
        {notifications.map((notification) => (
          <VolunteerNotificationToast
            key={notification.id}
            autoDismissMs={autoDismissMs}
            notification={notification}
            onDismiss={onDismiss}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      <style>{`
        @keyframes volunteer-notification-slide-in {
          from {
            opacity: 0;
            transform: translate3d(0, -10px, 0) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (min-width: 640px) {
          @keyframes volunteer-notification-slide-in {
            from {
              opacity: 0;
              transform: translate3d(18px, 0, 0) scale(0.98);
            }

            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
        }

        .volunteer-notification-enter {
          animation: volunteer-notification-slide-in 220ms ease-out;
        }
      `}</style>
    </>
  )
}

export default VolunteerNotificationStack
