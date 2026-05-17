import { describe, expect, it } from 'vitest'

import { findExistingViewerRating, readTaskAssignmentId } from './backendRating'

describe('backendRating helpers', () => {
  it('citeste taskAssignmentId din task snapshot', () => {
    expect(
      readTaskAssignmentId({
        id: 10,
        taskAssignmentId: 42,
      }),
    ).toBe(42)
  })

  it('gaseste ratingul trimis deja de viewer pentru taskul curent', () => {
    expect(
      findExistingViewerRating({
        taskAssignmentId: 42,
        viewerUserId: 'user-1',
        ratings: [
          {
            id: 5,
            taskAssignmentId: 42,
            writtenByUserId: 'user-1',
            receivedByUserId: 'user-2',
            stars: 4,
          },
          {
            id: 6,
            taskAssignmentId: 42,
            writtenByUserId: 'user-3',
            receivedByUserId: 'user-2',
            stars: 5,
          },
        ],
      }),
    ).toBe(4)
  })

  it('ignora ratingurile altor autori sau altor taskuri', () => {
    expect(
      findExistingViewerRating({
        taskAssignmentId: 42,
        viewerUserId: 'user-1',
        ratings: [
          {
            id: 7,
            taskAssignmentId: 41,
            writtenByUserId: 'user-1',
            receivedByUserId: 'user-2',
            stars: 5,
          },
          {
            id: 8,
            taskAssignmentId: 42,
            writtenByUserId: 'user-9',
            receivedByUserId: 'user-2',
            stars: 3,
          },
        ],
      }),
    ).toBeNull()
  })
})
