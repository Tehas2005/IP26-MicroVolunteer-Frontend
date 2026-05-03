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

export type TaskUrgencyType = 'LOW' | 'MEDIUM' | 'CRITICAL' | string
export type TaskStatusType =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | string
export type TaskCategoryType = 'FACETOFACE' | 'MESSAGES_ONLY' | string

export type TaskResponseType = {
  id: string
  title?: string | null
  description?: string | null
  category?: TaskCategoryType | null
  urgency?: TaskUrgencyType | null
  status?: TaskStatusType | null
  anonymousMode?: boolean | null
  userId?: string | null
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
  details?: string
  address?: string
  preferredContactMethod?: string
  preferredTimeWindow?: string
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
