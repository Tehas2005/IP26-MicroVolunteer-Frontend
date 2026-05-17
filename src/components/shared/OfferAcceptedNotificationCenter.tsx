import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BellRing, MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { backendWebSocketOrigin } from '@/lib/apiConfig'
import { backend } from '@/lib/backend'
import {
  extractNotificationPayload,
  readNotificationId,
  readNotificationTaskId,
  readNotificationText,
  readNotificationType,
} from '@/lib/notifications'
import { useAuthStore } from '@/store/authStore'

import { Button } from '@/components/ui/button'

type OfferAcceptedToast = {
  id: string
  taskId: string
  text: string
}

interface OfferAcceptedToastCardProps {
  notification: OfferAcceptedToast
  onDismiss: (notificationId: string) => void
  onOpenChat: (taskId: string, notificationId: string) => void
}

function OfferAcceptedToastCard({
  notification,
  onDismiss,
  onOpenChat,
}: OfferAcceptedToastCardProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(notification.id)
    }, 9000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notification.id, onDismiss])

  return (
    <article
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-auto rounded-[24px] border border-brand-purple/20 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple-dark">
          <BellRing className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-black">Oferta ta a fost acceptata</p>
              <p className="mt-1 text-sm leading-6 text-brand-gray-text">
                {notification.text || 'Cererea a fost acceptata. Poti continua conversatia in chat.'}
              </p>
            </div>

            <button
              aria-label="Inchide notificarea"
              className="rounded-full p-1.5 text-brand-gray-text transition hover:bg-brand-cream hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
              onClick={() => onDismiss(notification.id)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          {notification.taskId ? (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => onOpenChat(notification.taskId, notification.id)}
                size="sm"
                variant="auth"
              >
                <MessageCircle className="size-4" />
                Deschide chatul
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function OfferAcceptedNotificationCenter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const seenNotificationIdsRef = useRef(new Set<string>())
  const [notifications, setNotifications] = useState<OfferAcceptedToast[]>([])

  useEffect(() => {
    if (sessionStatus !== 'ready' || isGuest || !currentUserId) {
      return
    }

    let isActive = true
    let reconnectTimerId: number | null = null
    let socket: WebSocket | null = null

    const connect = () => {
      if (!isActive) {
        return
      }

      socket = new WebSocket(`${backendWebSocketOrigin}/api/notifications/ws`)

      socket.addEventListener('message', (event) => {
        const notification = extractNotificationPayload(event.data)

        if (!notification || readNotificationType(notification) !== 'OFFER_ACCEPTED') {
          return
        }

        const notificationId = readNotificationId(notification)

        if (!notificationId || seenNotificationIdsRef.current.has(notificationId)) {
          return
        }

        seenNotificationIdsRef.current.add(notificationId)

        setNotifications((currentNotifications) =>
          [
            {
              id: notificationId,
              taskId: readNotificationTaskId(notification),
              text: readNotificationText(notification),
            },
            ...currentNotifications,
          ].slice(0, 3),
        )

        queryClient.invalidateQueries({
          queryKey: ['backend-conversations', currentUserId],
        })

        void backend.notifications.markRead(notificationId)
      })

      socket.addEventListener('close', () => {
        if (!isActive) {
          return
        }

        reconnectTimerId = window.setTimeout(connect, 3000)
      })
    }

    connect()

    return () => {
      isActive = false

      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId)
      }

      socket?.close()
    }
  }, [currentUserId, isGuest, queryClient, sessionStatus])

  function handleDismiss(notificationId: string) {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    )
  }

  function handleOpenChat(taskId: string, notificationId: string) {
    handleDismiss(notificationId)
    navigate(`/chat/${taskId}`)
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-24 sm:w-full sm:max-w-sm">
      {notifications.map((notification) => (
        <OfferAcceptedToastCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
          onOpenChat={handleOpenChat}
        />
      ))}
    </div>
  )
}

export default OfferAcceptedNotificationCenter
