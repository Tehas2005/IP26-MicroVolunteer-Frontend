import { beforeEach, describe, expect, it } from 'vitest'

import {
  dismissMockConversationRatingPrompt,
  ensureMockConversation,
  getMockConversationThread,
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

    expect(volunteerThread?.conversation).toMatchObject({
      targetUserId: requesterIdentity.key,
      viewerRole: 'volunteer',
      ratingPromptPending: true,
    })
    expect(requesterThread?.conversation).toMatchObject({
      targetUserId: volunteerIdentity.key,
      viewerRole: 'requester',
      ratingPromptPending: true,
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
    dismissMockConversationRatingPrompt(conversation.id, volunteerIdentity)

    expect(getMockConversationThread(conversation.id, requesterIdentity)?.conversation.ratingPromptPending).toBe(false)
    expect(getMockConversationThread(conversation.id, volunteerIdentity)?.conversation.ratingPromptPending).toBe(false)
  })
})
