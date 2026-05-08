import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, MessageCircle, MessageCircleOff, X } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { listMockConversations, resolveChatViewerIdentity, subscribeToMockChat } from '@/lib/mockChat'
import { useAuthStore } from '@/store/authStore'

import type { Conversation } from './types'

export function ChatFab() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [isOpen, setIsOpen] = useState(false)
  const identity = useMemo(() => resolveChatViewerIdentity(user), [user])
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    listMockConversations(identity),
  )

  useEffect(() => {
    const refreshConversations = () => {
      setConversations(listMockConversations(identity))
    }

    refreshConversations()
    return subscribeToMockChat(refreshConversations)
  }, [identity])

  function handleFabClick() {
    if (isMobile) {
      navigate('/chat')
    } else {
      setIsOpen((prev) => !prev)
    }
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-[28px] border border-brand-gray bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-gray/60 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/chat')
              }}
              aria-label="Ecran complet"
              className="flex items-center gap-1 text-brand-gray-text transition-colors hover:text-brand-purple"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-brand-black">Conversații</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Închide"
              className="text-brand-gray-text transition-colors hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <MessageCircleOff className="h-9 w-9 text-brand-gray" />
              <p className="text-sm text-brand-gray-text">Nicio conversație încă.</p>
            </div>
          ) : (
            <div className="max-h-[360px] divide-y divide-brand-gray/40 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate(`/chat/${conv.id}`)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-cream"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-sm font-semibold text-brand-purple">
                    {conv.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-brand-black">{conv.username}</p>
                    </div>
                    <p className="truncate text-xs text-brand-gray-text">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple text-[10px] font-semibold text-white">
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleFabClick}
        aria-label="Deschide conversațiile"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-purple-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  )
}
