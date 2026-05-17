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
  suppressUnauthorizedEvent?: boolean
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
  | 'MATCHED'
  | 'ASSIGNED'
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
  city?: string | null
  addressText?: string | null
  skillsNeeded?: string[] | null
  displayName?: string | null
  isMine?: boolean | null
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

export type OfferStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | string

export type OfferVolunteerType = {
  username?: string | null
  trustScore?: number | null
  averageRating?: number | null
  name?: string | null
  hiddenIdentity?: boolean | null
  [key: string]: unknown
}

export type OfferResponseType = {
  id: string | number
  volunteerId?: string | number | null
  helpRequestId?: string | number | null
  taskId?: string | number | null
  message?: string | null
  status?: OfferStatusType | null
  createdAt?: string | null
  volunteer?: OfferVolunteerType | null
  taskAssignmentId?: string | number | null
  conversationId?: string | number | null
  [key: string]: unknown
}

export type OfferStatusPayloadType = {
  status: OfferStatusType
  [key: string]: unknown
}

export type OfferListFiltersType = {
  page?: number
  pageSize?: number
  status?: OfferStatusType
  [key: string]: string | number | boolean | null | undefined
}

export type PaginatedOfferListType = {
  data: OfferResponseType[]
  meta?: TaskListMetaType | null
}

export type NotificationRecordType = {
  id: string | number
  userId?: string | null
  guestSessionId?: string | null
  type?: string | null
  text?: string | null
  relatedRequestId?: string | number | null
  relatedAssignmentId?: string | number | null
  createdAt?: string | null
  readAt?: string | null
  [key: string]: unknown
}

export type NotificationListMetaType = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  unreadCount: number
}

export type NotificationListResponseType = {
  data: NotificationRecordType[]
  meta?: NotificationListMetaType | null
}

export type NotificationsListFiltersType = {
  page?: number
  pageSize?: number
  unreadOnly?: 'true' | 'false'
}

export type ReadAllNotificationsResponseType = {
  updatedCount: number
}

export type DeleteTaskDetailsResponseType = {
  success: boolean
  [key: string]: unknown
}

export type UploadResponseEnvelopeType = {
  data?: string | null
  message?: string | null
  statusCode?: number
  [key: string]: unknown
}
