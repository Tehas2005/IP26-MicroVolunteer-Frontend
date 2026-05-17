import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  VolunteerOwnProfileType,
  VolunteerProfilePayloadType,
} from './types'

export class VolunteerProfilesFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public getMe(): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.get<VolunteerOwnProfileType>('/api/volunteers/me/profile')
  }

  public createMe(
    payload: VolunteerProfilePayloadType,
  ): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.post<VolunteerOwnProfileType>('/api/volunteers/me/profile', payload)
  }

  public updateMe(
    payload: VolunteerProfilePayloadType,
  ): Promise<ApiResponse<VolunteerOwnProfileType>> {
    return this.fetcher.put<VolunteerOwnProfileType>('/api/volunteers/me/profile', payload)
  }
}
