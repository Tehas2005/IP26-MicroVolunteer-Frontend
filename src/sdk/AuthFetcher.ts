import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  BetterAuthSessionType,
  BetterAuthUserType,
  RequestPasswordResetPayloadType,
  ResetPasswordPayloadType,
  SignInEmailPayloadType,
  SignUpEmailPayloadType,
  VerifyEmailPayloadType,
} from './types'

type SignInResponseType = {
  redirect: boolean
  token: string
  url?: string | null
  user: BetterAuthUserType
}

type SignUpResponseType = {
  token?: string | null
  user: BetterAuthUserType
}

type SessionResponseType = {
  session: BetterAuthSessionType
  user: BetterAuthUserType
}

type SuccessResponseType = {
  success: boolean
}

type VerifyEmailResponseType = {
  status: boolean
  token: string | null
  user: BetterAuthUserType
}

export class AuthFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public setAuthToken(token: string) {
    this.fetcher.setAuthToken(token)
  }

  public readonly signIn = {
    email: async (
      payload: SignInEmailPayloadType,
    ): Promise<ApiResponse<SignInResponseType>> => {
      return this.fetcher.post<SignInResponseType>('/api/auth/sign-in/email', payload)
    },
  }

  public readonly signUp = {
    email: async (
      payload: SignUpEmailPayloadType,
    ): Promise<ApiResponse<SignUpResponseType>> => {
      return this.fetcher.post<SignUpResponseType>('/api/auth/sign-up/email', payload)
    },
  }

  public readonly getSession = async (): Promise<ApiResponse<SessionResponseType>> => {
    return this.fetcher.get<SessionResponseType>('/api/auth/get-session')
  }

  public readonly requestPasswordReset = async (
    payload: RequestPasswordResetPayloadType,
  ): Promise<ApiResponse<SuccessResponseType>> => {
    return this.fetcher.post<SuccessResponseType>(
      '/api/auth/email-otp/request-password-reset',
      payload,
    )
  }

  public readonly resetPassword = async (
    payload: ResetPasswordPayloadType,
  ): Promise<ApiResponse<SuccessResponseType>> => {
    return this.fetcher.post<SuccessResponseType>('/api/auth/email-otp/reset-password', payload)
  }

  public readonly verifyEmail = async (
    payload: VerifyEmailPayloadType,
  ): Promise<ApiResponse<VerifyEmailResponseType>> => {
    return this.fetcher.post<VerifyEmailResponseType>('/api/auth/email-otp/verify-email', payload)
  }

  public readonly sendVerificationOtp = async (
    email: string,
  ): Promise<ApiResponse<SuccessResponseType>> => {
    return this.fetcher.post<SuccessResponseType>('/api/auth/email-otp/send-verification-otp', {
      email,
      type: 'email-verification',
    })
  }

  public readonly signOut = async (): Promise<ApiResponse<SuccessResponseType>> => {
    return this.fetcher.post<SuccessResponseType>('/api/auth/sign-out')
  }
}
