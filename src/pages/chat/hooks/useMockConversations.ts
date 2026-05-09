import { useEffect, useMemo, useState } from 'react'

import { listMockConversations, resolveChatViewerIdentity, subscribeToMockChat } from '@/lib/mockChat'

import type { Conversation } from '../types'

export function useMockConversations(user?: { id: string; name: string } | null) {
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

  return { conversations, identity }
}
