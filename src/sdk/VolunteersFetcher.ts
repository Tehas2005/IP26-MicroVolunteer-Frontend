import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  CurrentVolunteerProfileResponseType,
  ProfileType,
  VolunteerProfilePayloadType,
} from './types'

export class VolunteersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public getById(userId: string): Promise<ApiResponse<ProfileType>> {
    return this.fetcher.get<ProfileType>(`/api/volunteers/${userId}`)
  }

  public getMeProfile(): Promise<ApiResponse<CurrentVolunteerProfileResponseType>> {
    return this.fetcher.get<CurrentVolunteerProfileResponseType>('/api/volunteers/me/profile')
  }

  public createMeProfile(
    payload: VolunteerProfilePayloadType,
  ): Promise<ApiResponse<CurrentVolunteerProfileResponseType>> {
    return this.fetcher.post<CurrentVolunteerProfileResponseType>('/api/volunteers/me/profile', payload)
  }

  public updateMeProfile(
    payload: VolunteerProfilePayloadType,
  ): Promise<ApiResponse<CurrentVolunteerProfileResponseType>> {
    return this.fetcher.put<CurrentVolunteerProfileResponseType>('/api/volunteers/me/profile', payload)
  }
}
