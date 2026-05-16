export type ApiResponse<T = unknown> = {
  data: T | null
  message: string | null
  success: boolean
  status: number
  isClientError: boolean
  isServerError: boolean
  isNotFound: boolean
  isUnauthorized: boolean
  isForbidden: boolean
}

export type FetcherConfigType = {
  baseURL: string
  headers: Record<string, string>
  beforeSend?: (config: FetcherConfigType) => FetcherConfigType
  onServerError?: (message: string) => void
}

export type FetcherRequestOptionsType = {
  headers?: Record<string, string>
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | null | undefined>
}

export type BetterAuthUserType = {
  id: string
  name: string
  email: string
  image?: string | null
  emailVerified?: boolean
}

export type BetterAuthSessionType = {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type SignInEmailPayloadType = {
  email: string
  password: string
  rememberMe?: boolean
}

export type SignUpEmailPayloadType = {
  email: string
  password: string
  name: string
}

export type RequestPasswordResetPayloadType = {
  email: string
}

export type ResetPasswordPayloadType = {
  email: string
  otp: string
  password: string
}

export type VerifyEmailPayloadType = {
  email: string
  otp: string
}

export type ProfileType = {
  id?: string
  userId?: string
  status?: string | null
  accountStatus?: string | null
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  phone?: string | null
  city?: string | null
  avatarUrl?: string | null
  bio?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type CreateProfilePayloadType = {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  city?: string
  avatarUrl?: string
  bio?: string
  [key: string]: unknown
}

export type UpdateProfilePayloadType = Partial<CreateProfilePayloadType>

export type TaskUrgencyType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
export type TaskStatusType =
  | 'OPEN'
  | 'ASSIGNED'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | string
export type TaskCategoryType = 'FACETOFACE' | 'FACE_TO_FACE' | 'MESSAGES_ONLY' | string

export type TaskResponseType = {
  id: string | number
  title?: string | null
  description?: string | null
  category?: TaskCategoryType | null
  urgency?: TaskUrgencyType | null
  status?: TaskStatusType | null
  anonymousMode?: boolean | null
  userId?: string | null
  requestedByUserId?: string | null
  helperUserId?: string | null
  createdAt?: string
  updatedAt?: string
  details?: Record<string, unknown> | null
  [key: string]: unknown
}

export type TaskSubmissionPayloadType = {
  title: string
  description?: string
  category?: TaskCategoryType
  urgency?: TaskUrgencyType
  anonymousMode?: boolean
  [key: string]: unknown
}

export type TaskDetailsPayloadType = {
  notes?: string
  languageNeeded?: string
  safetyNotes?: string
  [key: string]: unknown
}

export type TaskStatusPayloadType = {
  status: TaskStatusType
  [key: string]: unknown
}

export type TaskFiltersType = {
  status?: TaskStatusType
  urgency?: TaskUrgencyType
  category?: TaskCategoryType
  mine?: boolean
  [key: string]: string | number | boolean | null | undefined
}

export type TaskListMetaType = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PaginatedTaskListType = {
  data: TaskResponseType[]
  meta?: TaskListMetaType | null
}

export type GuestSessionResponseType = {
  sessionId?: string | null
  [key: string]: unknown
}

export type OfferStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | string

export type OfferResponseType = {
  id?: string | number
  volunteerId?: string | number | null
  volunteerUserId?: string | number | null
  userId?: string | number | null
  helpRequestId?: string | number | null
  taskId?: string | number | null
  message?: string | null
  status?: OfferStatusType | null
  createdAt?: string | null
  updatedAt?: string | null
  task?: TaskResponseType | null
  volunteer?: ProfileType | null
  [key: string]: unknown
}

export type OfferSubmissionPayloadType = {
  message?: string
}

export type OfferStatusPayloadType = {
  status: 'ACCEPTED' | 'REJECTED'
}

export type OfferFiltersType = {
  page?: number
  pageSize?: number
  status?: OfferStatusType
}

export type PaginatedOfferListType = {
  data: OfferResponseType[]
  meta?: {
    currentPage?: number
    pageSize?: number
    totalItems?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
    [key: string]: unknown
  } | null
}

export type NotificationType =
  | 'NEW_REQUEST'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'TASK_UPDATED'
  | string

export type NotificationResponseType = {
  id?: string | number
  userId?: string | null
  guestSessionId?: string | null
  type?: NotificationType | null
  text?: string | null
  relatedRequestId?: string | number | null
  relatedAssignmentId?: string | number | null
  createdAt?: string | null
  readAt?: string | null
  [key: string]: unknown
}

export type NotificationFiltersType = {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
}

export type PaginatedNotificationListType = {
  data: NotificationResponseType[]
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
    unreadCount?: number
    [key: string]: unknown
  } | null
}

export type NotificationMarkAllReadResponseType = {
  updatedCount?: number
  [key: string]: unknown
}

export type DeleteTaskDetailsResponseType = {
  success: boolean
  [key: string]: unknown
}

export type TaskMessageContentType = 'TEXTCONTENT' | 'AUDIOCONTENT' | string

export type TaskMessageResponseType = {
  id?: string | number
  type?: TaskMessageContentType | null
  content?: string | null
  audioUrl?: string | null
  senderId?: string | number | null
  userId?: string | number | null
  authorUserId?: string | number | null
  createdByUserId?: string | number | null
  createdAt?: string | null
  sentAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export type RatingSubmissionPayloadType = {
  taskAssignmentId: number
  writtenByUserId: string
  receivedByUserId: string
  stars: number
  comment?: string
}

export type RatingResponseType = {
  id?: string | number
  taskAssignmentId?: string | number | null
  writtenByUserId?: string | null
  receivedByUserId?: string | null
  stars?: number | null
  comment?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type RatingSummaryType = {
  averageRating?: string | number | null
  ratingsCount?: number | null
  [key: string]: unknown
}

export type UploadResponseEnvelopeType = {
  data?: string | null
  message?: string | null
  statusCode?: number
  [key: string]: unknown
}

export type InteractionResponseType = {
  id?: string | number
  createdAt?: string | null
  updatedAt?: string | null
  summary?: string | null
  message?: string | null
  description?: string | null
  rating?: number | null
  stars?: number | null
  taskTitle?: string | null
  task?: {
    title?: string | null
    [key: string]: unknown
  } | null
  [key: string]: unknown
}
