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

function readNestedTasksArray(payload: unknown): TaskResponseType[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as TaskResponseType[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const directData = payload.data

  if (Array.isArray(directData)) {
    return directData.filter(isRecord) as TaskResponseType[]
  }

  if (directData && typeof directData === 'object') {
    return readNestedTasksArray(directData)
  }

  return []
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

function normalizeUserId(userId: unknown): string | null {
  if (typeof userId === 'number') {
    return String(userId)
  }

  if (typeof userId === 'string' && userId.trim()) {
    return userId.trim()
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

function readTaskCity(task: TaskResponseType): string | null {
  const directCity = normalizeUserId(task.city) ?? normalizeUserId(task['addressText'])

  if (directCity) {
    return directCity
  }

  const details = task.details

  if (!isRecord(details)) {
    return null
  }

  const city = details.city

  return typeof city === 'string' && city.trim() ? city.trim() : null
}

function readTaskSkillsNeeded(task: TaskResponseType): string[] {
  const directSkills = task['skillsNeeded']

  if (Array.isArray(directSkills)) {
    return directSkills
      .filter((skill): skill is string => typeof skill === 'string' && Boolean(skill.trim()))
      .map((skill) => skill.trim())
  }

  const details = task.details

  if (!isRecord(details)) {
    return []
  }

  const skillsNeeded = details.skillsNeeded

  if (!Array.isArray(skillsNeeded)) {
    return []
  }

  return skillsNeeded
    .filter((skill): skill is string => typeof skill === 'string' && Boolean(skill.trim()))
    .map((skill) => skill.trim())
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
  if (isRecord(payload)) {
    const directTaskId = normalizeTaskId(payload.id as string | number | null | undefined)

    if (directTaskId) {
      return directTaskId
    }
  }

  const task = readEnvelopeData<unknown>(payload)

  if (!isRecord(task)) {
    return null
  }

  return normalizeTaskId(task.id as string | number | null | undefined)
}

export function extractTasksList(payload: unknown): TaskResponseType[] {
  const directTasks = readNestedTasksArray(payload)

  if (directTasks.length > 0) {
    return directTasks
  }

  const paginatedPayload = readEnvelopeData<unknown>(payload)

  if (!isRecord(paginatedPayload)) {
    return []
  }

  const tasksData = (paginatedPayload as PaginatedTasksPayload).data

  return Array.isArray(tasksData) ? tasksData.filter(isRecord) as TaskResponseType[] : []
}

export function extractTaskPayload(payload: unknown): TaskResponseType | null {
  if (isRecord(payload) && 'id' in payload) {
    return payload as TaskResponseType
  }

  const nestedPayload = readEnvelopeData<unknown>(payload)

  if (isRecord(nestedPayload) && 'id' in nestedPayload) {
    return nestedPayload as TaskResponseType
  }

  return null
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

  const requesterUserId =
    normalizeUserId(task.requestedByUserId) ||
    normalizeUserId(task.userId) ||
    normalizeUserId(task['ownerUserId']) ||
    normalizeUserId(task['createdByUserId'])

  return Boolean(currentUserId && requesterUserId && requesterUserId === currentUserId)
}

export function mapTaskToLiveRequestCard(
  task: TaskResponseType,
  options: {
    currentUserId?: string | null
    currentUserName?: string | null
    isOwnedByCurrentUser: boolean
  },
): LiveRequestCardData {
  const { currentUserId, currentUserName, isOwnedByCurrentUser } = options
  const isAnonymous = Boolean(task.anonymousMode)
  const requesterUserId =
    normalizeUserId(task.requestedByUserId) ||
    normalizeUserId(task.userId) ||
    normalizeUserId(task['ownerUserId']) ||
    normalizeUserId(task['createdByUserId']) ||
    (isOwnedByCurrentUser ? normalizeUserId(currentUserId) : null)

  return {
    id: normalizeTaskId(task.id) ?? crypto.randomUUID(),
    title: task.title,
    description: task.description,
    category: mapCategory(task.category),
    urgencyLevel: mapUrgency(task.urgency),
    anonymousMode: isAnonymous,
    username: isAnonymous ? ANONYMOUS_DISPLAY_NAME : null,
    name: isOwnedByCurrentUser ? currentUserName?.trim() || GENERIC_REQUESTER_NAME : GENERIC_REQUESTER_NAME,
    city: readTaskCity(task),
    skillsNeeded: readTaskSkillsNeeded(task),
    requesterKey: requesterUserId
      ? `user:${requesterUserId}`
      : `guest-request:${normalizeTaskId(task.id) ?? crypto.randomUUID()}`,
    requesterKind: requesterUserId ? 'user' : 'guest',
    requesterLabel: isAnonymous
      ? ANONYMOUS_DISPLAY_NAME
      : isOwnedByCurrentUser
        ? currentUserName?.trim() || GENERIC_REQUESTER_NAME
        : GENERIC_REQUESTER_NAME,
  }
}

export function readTaskRequesterUserId(task: TaskResponseType): string {
  return (
    normalizeUserId(task.requestedByUserId) ||
    normalizeUserId(task.userId) ||
    normalizeUserId(task['ownerUserId']) ||
    normalizeUserId(task['createdByUserId']) ||
    ''
  )
}

export function readTaskHelperUserId(task: TaskResponseType): string {
  return (
    normalizeUserId(task.helperUserId) ||
    normalizeUserId(task['volunteerUserId']) ||
    normalizeUserId(task['assignedUserId']) ||
    ''
  )
}
