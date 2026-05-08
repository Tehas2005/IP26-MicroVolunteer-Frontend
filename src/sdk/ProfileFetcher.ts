import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  CreateProfilePayloadType,
  ProfileType,
  UpdateProfilePayloadType,
} from './types'

export class ProfileFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public create(payload: CreateProfilePayloadType): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.post<ProfileType>('/api/profile', payload)
  }

  public getMe(): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.get<ProfileType>('/api/profile/me')
  }

  public getByUserId(userId: string): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.get<ProfileType>(`/api/profile/${userId}`)
  }

  public updateMe(payload: UpdateProfilePayloadType): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.put<ProfileType>('/api/profile/me', payload)
  }

  public deleteMe(): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetcher.delete<{ success: boolean }>('/api/profile/me')
  }
}
