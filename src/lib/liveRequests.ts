import type { LiveRequestCardData, LiveRequestCategory, LiveRequestUrgencyLevel } from '@/components/shared/LiveRequestCard'
import type { TaskResponseType } from '@/sdk/types'

const CREATED_TASK_IDS_STORAGE_KEY = 'mvcr-created-task-ids'
const ANONYMOUS_DISPLAY_NAME = 'utilizator_anonim'
const GENERIC_REQUESTER_NAME = 'Solicitant'

type ResponseEnvelope<T> = {
  data?: T | null
}

type PaginatedTasksPayload = {
  data?: TaskResponseType[] | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readEnvelopeData<T>(payload: unknown): T | null {
  if (!isRecord(payload) || !('data' in payload)) {
    return null
  }

  return (payload as ResponseEnvelope<T>).data ?? null
}

function normalizeTaskId(taskId: string | number | null | undefined): string | null {
  if (typeof taskId === 'number') {
    return String(taskId)
  }

  if (typeof taskId === 'string' && taskId.trim()) {
    return taskId.trim()
  }

  return null
}

function readStoredTaskIdsMap(): Record<string, string[]> {
  if (typeof window === 'undefined') {
    return {}
  }

  const rawValue = window.localStorage.getItem(CREATED_TASK_IDS_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!isRecord(parsed)) {
      return {}
    }

    return Object.entries(parsed).reduce<Record<string, string[]>>((accumulator, [userId, value]) => {
      if (
        typeof userId === 'string' &&
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string')
      ) {
        accumulator[userId] = value
      }

      return accumulator
    }, {})
  } catch {
    return {}
  }
}

function writeStoredTaskIdsMap(value: Record<string, string[]>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CREATED_TASK_IDS_STORAGE_KEY, JSON.stringify(value))
}

function mapCategory(category?: string | null): LiveRequestCategory | null {
  if (category === 'FACE_TO_FACE' || category === 'FACETOFACE') {
    return 'FACETOFACE'
  }

  if (category === 'MESSAGES_ONLY') {
    return 'MESSAGES_ONLY'
  }

  return null
}

function mapUrgency(urgency?: string | null): LiveRequestUrgencyLevel | null {
  if (urgency === 'LOW' || urgency === 'MEDIUM' || urgency === 'HIGH' || urgency === 'CRITICAL') {
    return urgency
  }

  return null
}

export function readCreatedTaskIds(userId?: string | null): string[] {
  if (!userId) {
    return []
  }

  const storedTaskIdsMap = readStoredTaskIdsMap()

  return storedTaskIdsMap[userId] ?? []
}

export function rememberCreatedTaskId(userId: string, taskId: string | number | null | undefined) {
  const normalizedTaskId = normalizeTaskId(taskId)

  if (!userId || !normalizedTaskId) {
    return
  }

  const storedTaskIdsMap = readStoredTaskIdsMap()
  const currentTaskIds = storedTaskIdsMap[userId] ?? []
  const nextTaskIds = Array.from(new Set([...currentTaskIds, normalizedTaskId]))

  writeStoredTaskIdsMap({
    ...storedTaskIdsMap,
    [userId]: nextTaskIds,
  })
}

export function extractCreatedTaskId(payload: unknown): string | null {
  const task = readEnvelopeData<unknown>(payload)

  if (!isRecord(task)) {
    return null
  }

  return normalizeTaskId(task.id as string | number | null | undefined)
}

export function extractTasksList(payload: unknown): TaskResponseType[] {
  const paginatedPayload = readEnvelopeData<unknown>(payload)

  if (!isRecord(paginatedPayload)) {
    return []
  }

  const tasksData = (paginatedPayload as PaginatedTasksPayload).data

  return Array.isArray(tasksData) ? tasksData.filter(isRecord) as TaskResponseType[] : []
}

export function isTaskOwnedByCurrentUser(
  task: TaskResponseType,
  currentUserId?: string | null,
  locallyTrackedTaskIds: Set<string> = new Set(),
) {
  const normalizedTaskId = normalizeTaskId(task.id)

  if (normalizedTaskId && locallyTrackedTaskIds.has(normalizedTaskId)) {
    return true
  }

  return Boolean(currentUserId && task.requestedByUserId && task.requestedByUserId === currentUserId)
}

export function mapTaskToLiveRequestCard(
  task: TaskResponseType,
  options: {
    currentUserName?: string | null
    isOwnedByCurrentUser: boolean
  },
): LiveRequestCardData {
  const { currentUserName, isOwnedByCurrentUser } = options
  const isAnonymous = Boolean(task.anonymousMode)

  return {
    id: normalizeTaskId(task.id) ?? crypto.randomUUID(),
    title: task.title,
    category: mapCategory(task.category),
    urgencyLevel: mapUrgency(task.urgency),
    anonymousMode: isAnonymous,
    username: isAnonymous ? ANONYMOUS_DISPLAY_NAME : null,
    name: isOwnedByCurrentUser ? currentUserName?.trim() || GENERIC_REQUESTER_NAME : GENERIC_REQUESTER_NAME,
    requesterKey: task.requestedByUserId
      ? `user:${task.requestedByUserId}`
      : `guest-request:${normalizeTaskId(task.id) ?? crypto.randomUUID()}`,
    requesterKind: task.requestedByUserId ? 'user' : 'guest',
    requesterLabel: isAnonymous
      ? ANONYMOUS_DISPLAY_NAME
      : isOwnedByCurrentUser
        ? currentUserName?.trim() || GENERIC_REQUESTER_NAME
        : GENERIC_REQUESTER_NAME,
  }
}
