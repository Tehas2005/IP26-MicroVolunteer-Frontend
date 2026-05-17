import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { backend } from '@/lib/backend'
import { extractOfferList, readOfferTaskId } from '@/lib/helpOffers'
import {
  extractTaskPayload,
  extractTasksList,
  readTaskHelperUserId,
  readTaskRequesterUserId,
} from '@/lib/liveRequests'
import type { OfferResponseType, TaskResponseType } from '@/sdk/types'
import { useAuthStore } from '@/store/authStore'

import type { Conversation } from '../types'

const REQUESTER_FALLBACK_NAME = 'Solicitant'
const VOLUNTEER_FALLBACK_NAME = 'Voluntar'
const ANONYMOUS_REQUESTER_NAME = 'utilizator_anonim'
const CHAT_ELIGIBLE_STATUSES = new Set(['ASSIGNED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'])
const MAX_OFFERS_PAGE_SIZE = 50

function normalizeTaskId(taskId: string | number | null | undefined) {
  if (typeof taskId === 'number') {
    return String(taskId)
  }

  if (typeof taskId === 'string' && taskId.trim()) {
    return taskId.trim()
  }

  return ''
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return new Date()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function normalizeStatus(status: string | null | undefined) {
  return typeof status === 'string' ? status.trim().toUpperCase() : ''
}

function isChatEligibleStatus(status: string | null | undefined) {
  return CHAT_ELIGIBLE_STATUSES.has(normalizeStatus(status))
}

function countDefinedKeys(value: TaskResponseType | null | undefined) {
  if (!value) {
    return 0
  }

  return Object.values(value).filter((entry) => entry !== undefined && entry !== null && entry !== '').length
}

function pickPreferredTask(currentTask: TaskResponseType | undefined, nextTask: TaskResponseType) {
  if (!currentTask) {
    return nextTask
  }

  const currentEligible = isChatEligibleStatus(currentTask.status)
  const nextEligible = isChatEligibleStatus(nextTask.status)

  if (currentEligible !== nextEligible) {
    return nextEligible ? nextTask : currentTask
  }

  return countDefinedKeys(nextTask) >= countDefinedKeys(currentTask) ? nextTask : currentTask
}

function mapAcceptedOfferToTask(offer: OfferResponseType): TaskResponseType | null {
  const taskId = readOfferTaskId(offer)

  if (!taskId) {
    return null
  }

  const nestedTask = offer.task

  if (nestedTask && typeof nestedTask === 'object') {
    return {
      ...nestedTask,
      id: nestedTask.id ?? taskId,
      updatedAt: nestedTask.updatedAt ?? offer.updatedAt ?? offer.createdAt ?? undefined,
      createdAt: nestedTask.createdAt ?? offer.createdAt ?? undefined,
    }
  }

  return {
    id: taskId,
    title: typeof offer.taskTitle === 'string' ? offer.taskTitle : null,
    description: typeof offer.taskDescription === 'string' ? offer.taskDescription : null,
    status: typeof offer.taskStatus === 'string' ? offer.taskStatus : null,
    createdAt: offer.createdAt ?? undefined,
    updatedAt: offer.updatedAt ?? offer.createdAt ?? undefined,
  }
}

function canOpenTaskConversation(
  task: TaskResponseType,
  currentUserId: string,
  volunteerTaskIds: Set<string>,
) {
  const taskId = normalizeTaskId(task.id)
  const taskStatus = normalizeStatus(task.status)

  if (!CHAT_ELIGIBLE_STATUSES.has(taskStatus)) {
    return false
  }

  if (readTaskRequesterUserId(task) === currentUserId) {
    return true
  }

  if (readTaskHelperUserId(task) === currentUserId) {
    return true
  }

  // Backend may not return helperUserId — fall back to accepted-offer membership
  if (taskId && volunteerTaskIds.has(taskId)) {
    return true
  }

  return false
}

function mapTaskToConversation(
  task: TaskResponseType,
  currentUserId: string,
  volunteerTaskIds: Set<string>,
): Conversation | null {
  const taskId = normalizeTaskId(task.id)

  if (!taskId || !canOpenTaskConversation(task, currentUserId, volunteerTaskIds)) {
    return null
  }

  const requesterUserId = readTaskRequesterUserId(task)
  const helperUserId = readTaskHelperUserId(task)

  // A user is viewing as requester only if they own the task.
  // If helperUserId matches or the task came from an accepted offer (and they're not the requester),
  // they are the volunteer.
  const isRequesterViewing =
    requesterUserId === currentUserId &&
    helperUserId !== currentUserId &&
    !volunteerTaskIds.has(taskId)

  const normalizedStatus = normalizeStatus(task.status)
  const isClosed = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED'
  const targetUserId = isRequesterViewing ? helperUserId : requesterUserId
  const targetUserName = isRequesterViewing
    ? VOLUNTEER_FALLBACK_NAME
    : task.anonymousMode
      ? ANONYMOUS_REQUESTER_NAME
      : REQUESTER_FALLBACK_NAME

  return {
    id: taskId,
    username: targetUserName,
    lastMessage: task.title?.trim() ? `Cerere: ${task.title.trim()}` : 'Conversatie task',
    timestamp: normalizeDate(task.updatedAt ?? task.createdAt),
    unread: 0,
    status: isClosed ? 'closed' : 'open',
    requestId: taskId,
    requestTitle: task.title?.trim() || 'Cerere fara titlu',
    targetUserId,
    targetUserName,
    viewerRole: isRequesterViewing ? 'requester' : 'volunteer',
    viewerHasRated: false,
    ratingPromptPending: false,
    viewerRating: null,
  }
}

export function useBackendConversations() {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  const query = useQuery({
    queryKey: ['backend-conversations', currentUserId],
    enabled: sessionStatus === 'ready' && !isGuest && Boolean(currentUserId),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const [tasksResponse, acceptedOffersResponse] = await Promise.all([
        backend.tasks.list({
          page: 1,
          pageSize: 100,
          order: 'DESC',
        }),
        backend.offers.listMine({
          page: 1,
          pageSize: MAX_OFFERS_PAGE_SIZE,
          status: 'ACCEPTED',
        }),
      ])

      if (!tasksResponse.success && !acceptedOffersResponse.success) {
        throw new Error(tasksResponse.message || 'Nu am putut incarca conversatiile.')
      }

      const tasks = tasksResponse.success ? extractTasksList(tasksResponse.data) : []
      const acceptedOffers = acceptedOffersResponse.success
        ? extractOfferList(acceptedOffersResponse.data)
        : []
      const acceptedOfferTasks = acceptedOffers
        .map((offer) => mapAcceptedOfferToTask(offer))
        .filter((task): task is TaskResponseType => task !== null)

      // All task IDs where the current user is the volunteer (via accepted offer)
      const volunteerTaskIds = new Set(
        acceptedOffers.map((offer) => readOfferTaskId(offer)).filter(Boolean),
      )

      const knownTaskIds = new Set(tasks.map((task) => normalizeTaskId(task.id)).filter(Boolean))
      const missingVolunteerTaskIds = Array.from(volunteerTaskIds).filter(
        (taskId) => !knownTaskIds.has(taskId),
      )

      const volunteerTasks = await Promise.all(
        missingVolunteerTaskIds.map(async (taskId) => {
          const response = await backend.tasks.getById(taskId)
          return response.success && response.data ? extractTaskPayload(response.data) : null
        }),
      )

      const mergedTasks = new Map<string, TaskResponseType>()

      ;[...tasks, ...acceptedOfferTasks, ...volunteerTasks.filter((task): task is TaskResponseType => task !== null)]
        .forEach((task) => {
          const taskId = normalizeTaskId(task.id)

          if (!taskId) {
            return
          }

          mergedTasks.set(taskId, pickPreferredTask(mergedTasks.get(taskId), task))
        })

      return {
        tasks: Array.from(mergedTasks.values()),
        volunteerTaskIds,
      }
    },
  })

  const conversations = useMemo(() => {
    if (!currentUserId) {
      return []
    }

    const volunteerTaskIds = query.data?.volunteerTaskIds ?? new Set<string>()

    const directConversations = (query.data?.tasks ?? [])
      .map((task) => mapTaskToConversation(task, currentUserId, volunteerTaskIds))
      .filter((conversation): conversation is Conversation => conversation !== null)

    const deduplicatedConversations = new Map<string, Conversation>()

    directConversations.forEach((conversation) => {
      const existingConversation = deduplicatedConversations.get(conversation.id)

      if (
        !existingConversation ||
        conversation.timestamp.getTime() > existingConversation.timestamp.getTime()
      ) {
        deduplicatedConversations.set(conversation.id, conversation)
      }
    })

    return Array.from(deduplicatedConversations.values()).sort(
      (left, right) => right.timestamp.getTime() - left.timestamp.getTime(),
    )
  }, [currentUserId, query.data])

  return {
    conversations,
    isLoading: query.isLoading,
  }
}
