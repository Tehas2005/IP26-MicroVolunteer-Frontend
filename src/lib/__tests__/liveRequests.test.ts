import { beforeEach, describe, expect, it } from 'vitest'

import {
  extractCreatedTaskId,
  extractTasksList,
  isTaskOwnedByCurrentUser,
  mapTaskToLiveRequestCard,
  readCreatedTaskIds,
  rememberCreatedTaskId,
} from '@/lib/liveRequests'

describe('liveRequests helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('memoreaza si citeste taskurile create local pentru userul curent', () => {
    rememberCreatedTaskId('user-1', 12)
    rememberCreatedTaskId('user-1', '13')
    rememberCreatedTaskId('user-1', '13')

    expect(readCreatedTaskIds('user-1')).toEqual(['12', '13'])
    expect(readCreatedTaskIds('user-2')).toEqual([])
  })

  it('extrage id-ul taskului creat si lista de taskuri din envelope-ul backendului', () => {
    expect(extractCreatedTaskId({ data: { id: 42 } })).toBe('42')
    expect(extractCreatedTaskId({ data: null })).toBeNull()

    expect(
      extractTasksList({
        data: {
          data: [{ id: 'task-1', title: 'Cerere 1' }, { id: 'task-2', title: 'Cerere 2' }],
        },
      }),
    ).toHaveLength(2)

    expect(extractTasksList({ data: null })).toEqual([])
  })

  it('identifica corect taskurile proprii si mapeaza cardul pentru cereri anonime', () => {
    const ownedByBackend = isTaskOwnedByCurrentUser(
      { id: 'task-1', requestedByUserId: 'user-1' },
      'user-1',
    )
    const ownedByLocalTracking = isTaskOwnedByCurrentUser(
      { id: 'task-2', anonymousMode: true },
      'user-1',
      new Set(['task-2']),
    )

    expect(ownedByBackend).toBe(true)
    expect(ownedByLocalTracking).toBe(true)

    const anonymousCard = mapTaskToLiveRequestCard(
      {
        id: 'task-2',
        title: 'Ajutor rapid',
        category: 'MESSAGES_ONLY',
        urgency: 'MEDIUM',
        anonymousMode: true,
      },
      {
        currentUserName: 'Ion Socol',
        isOwnedByCurrentUser: false,
      },
    )

    expect(anonymousCard.username).toBe('utilizator_anonim')
    expect(anonymousCard.name).toBe('Solicitant')
    expect(anonymousCard.category).toBe('MESSAGES_ONLY')
    expect(anonymousCard.urgencyLevel).toBe('MEDIUM')
  })
})
