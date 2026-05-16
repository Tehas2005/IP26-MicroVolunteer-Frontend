import type { Fetcher } from './Fetcher'
import type { ApiResponse, CreateProfilePayloadType, ProfileType, UpdateProfilePayloadType } from './types'

export class VolunteersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public getById(userId: string): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.get<ProfileType>(`/api/volunteers/${userId}`)
  }

  public getMeProfile(): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.get<ProfileType>('/api/volunteers/me/profile')
  }

  public createMeProfile(payload: CreateProfilePayloadType): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.post<ProfileType>('/api/volunteers/me/profile', payload)
  }

  public updateMeProfile(payload: UpdateProfilePayloadType): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.put<ProfileType>('/api/volunteers/me/profile', payload)
  }
}
