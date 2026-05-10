import { beforeEach, describe, expect, it } from 'vitest'

import {
  ensureMockConversation,
  getMockConversationThread,
  skipMockConversationRating,
  submitMockConversationRating,
  type ChatViewerIdentity,
} from '@/lib/mockChat'

const requesterIdentity: ChatViewerIdentity = {
  key: 'user:requester-1',
  displayName: 'Maria',
  isGuest: false,
}

const volunteerIdentity: ChatViewerIdentity = {
  key: 'user:volunteer-1',
  displayName: 'Andrei',
  isGuest: false,
}

describe('mockChat rating flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('expune targetUserId-ul corect pentru fiecare participant la o conversatie inchisa', () => {
    const conversation = ensureMockConversation(
      {
        id: 'request-closed-1',
        title: 'Ajutor farmacie',
        requesterKey: requesterIdentity.key,
        requesterLabel: requesterIdentity.displayName,
        requesterKind: 'user',
        status: 'closed',
      },
      volunteerIdentity,
    )

    const volunteerThread = getMockConversationThread(conversation.id, volunteerIdentity)
    const requesterThread = getMockConversationThread(conversation.id, requesterIdentity)

    expect(volunteerThread?.ratingPrompt).toMatchObject({
      targetUserId: requesterIdentity.key,
      viewerRole: 'volunteer',
      shouldPrompt: true,
    })
    expect(requesterThread?.ratingPrompt).toMatchObject({
      targetUserId: volunteerIdentity.key,
      viewerRole: 'requester',
      shouldPrompt: true,
    })
  })

  it('nu mai afiseaza promptul dupa submit sau omit pentru utilizatorul curent', () => {
    const conversation = ensureMockConversation(
      {
        id: 'request-closed-2',
        title: 'Ajutor programare',
        requesterKey: requesterIdentity.key,
        requesterLabel: requesterIdentity.displayName,
        requesterKind: 'user',
        status: 'closed',
      },
      volunteerIdentity,
    )

    submitMockConversationRating(conversation.id, 5, requesterIdentity)
    skipMockConversationRating(conversation.id, volunteerIdentity)

    expect(getMockConversationThread(conversation.id, requesterIdentity)?.ratingPrompt?.shouldPrompt).toBe(false)
    expect(getMockConversationThread(conversation.id, volunteerIdentity)?.ratingPrompt?.shouldPrompt).toBe(false)
  })
})
