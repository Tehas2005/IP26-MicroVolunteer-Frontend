import type {
  RatingSubmissionPayloadType,
  TaskResponseType,
  TaskStatusType,
} from '@/sdk/types'

const DIRECT_ASSIGNMENT_ID_KEYS = ['taskAssignmentId', 'assignmentId'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readAssignmentId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value.trim())

    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue
    }
  }

  return null
}

function findTaskAssignmentId(source: unknown, depth = 0): number | null {
  if (!isRecord(source) || depth > 4) {
    return null
  }

  for (const key of DIRECT_ASSIGNMENT_ID_KEYS) {
    const assignmentId = readAssignmentId(source[key])

    if (assignmentId !== null) {
      return assignmentId
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (!key.toLowerCase().includes('assignment')) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedAssignmentId = findTaskAssignmentId(item, depth + 1)

        if (nestedAssignmentId !== null) {
          return nestedAssignmentId
        }
      }

      continue
    }

    const nestedAssignmentId = findTaskAssignmentId(value, depth + 1)

    if (nestedAssignmentId !== null) {
      return nestedAssignmentId
    }
  }

  return null
}

function isTaskCompleted(status: TaskStatusType | null | undefined) {
  return typeof status === 'string' && status.toUpperCase() === 'COMPLETED'
}

export function resolveRatingSubmissionPayload(options: {
  task: TaskResponseType
  viewerUserId?: string | null
  targetUserId?: string | null
  stars: number
}): { payload: RatingSubmissionPayloadType | null; errorMessage: string | null } {
  const { task, viewerUserId, targetUserId, stars } = options

  if (!viewerUserId) {
    return {
      payload: null,
      errorMessage: 'Trebuie sa fii autentificat pentru a trimite un rating.',
    }
  }

  if (!targetUserId) {
    return {
      payload: null,
      errorMessage: 'Nu am putut identifica utilizatorul care trebuie evaluat.',
    }
  }

  if (!isTaskCompleted(task.status)) {
    return {
      payload: null,
      errorMessage: 'Ratingul poate fi trimis doar dupa ce taskul este finalizat.',
    }
  }

  const taskAssignmentId = findTaskAssignmentId(task)

  if (taskAssignmentId === null) {
    return {
      payload: null,
      errorMessage:
        'Backendul nu expune inca taskAssignmentId pentru acest task, deci ratingul nu poate fi trimis in mod real.',
    }
  }

  return {
    payload: {
      taskAssignmentId,
      writtenByUserId: viewerUserId,
      receivedByUserId: targetUserId,
      stars,
    },
    errorMessage: null,
  }
}
