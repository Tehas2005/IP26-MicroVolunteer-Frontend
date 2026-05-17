import { beforeEach, describe, expect, it } from 'vitest'

import {
  cancelMockRequestConversations,
  dismissMockConversationRatingPrompt,
  ensureMockConversation,
  ensureMockConversationForAcceptedOffer,
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

  it('inchide conversatia si adauga mesaj de sistem cand autorul anuleaza cererea', () => {
    const conversation = ensureMockConversationForAcceptedOffer(
      {
        id: 'request-cancel-1',
        title: 'Ajutor anulare',
        requesterKey: requesterIdentity.key,
        requesterLabel: requesterIdentity.displayName,
        requesterKind: 'user',
      },
      requesterIdentity,
      {
        volunteerKey: volunteerIdentity.key,
        volunteerName: volunteerIdentity.displayName,
      },
    )

    cancelMockRequestConversations('request-cancel-1', requesterIdentity)

    const volunteerThread = getMockConversationThread(conversation.id, volunteerIdentity)

    expect(volunteerThread?.conversation.status).toBe('closed')
    expect(
      volunteerThread?.messages.some(
        (message) =>
          message.from === 'system' &&
          message.content.type === 'text' &&
          message.content.text === 'Autorul a anulat această cerere.',
      ),
    ).toBe(true)
  })
})
