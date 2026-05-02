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
