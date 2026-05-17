import type { Fetcher } from './Fetcher'
import type { ApiResponse, BecomeVolunteerResponseType, InteractionResponseType } from './types'

export class UsersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public becomeVolunteer(): Promise<ApiResponse<BecomeVolunteerResponseType>> {
    return this.fetcher.post<BecomeVolunteerResponseType>('/api/users/become-volunteer')
  }

  public getInteractions(
    userId: string,
    query?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<ApiResponse<InteractionResponseType[]>> {
    return this.fetcher.get<InteractionResponseType[]>(`/api/users/${userId}/interactions`, {
      query,
    })
  }
}
