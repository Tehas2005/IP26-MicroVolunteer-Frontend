import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  VolunteerOwnProfileType,
  VolunteerProfileCreatePayloadType,
  VolunteerProfileUpdatePayloadType,
} from './types'

export class VolunteerProfilesFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public getMe(): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.get<VolunteerOwnProfileType>('/api/volunteers/me/profile')
  }

  public createMe(
    payload: VolunteerProfileCreatePayloadType,
  ): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.post<VolunteerOwnProfileType>('/api/volunteers/me/profile', payload)
  }

  public updateMe(
    payload: VolunteerProfileUpdatePayloadType,
  ): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.put<VolunteerOwnProfileType>('/api/volunteers/me/profile', payload)
  }
}
