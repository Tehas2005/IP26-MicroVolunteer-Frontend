import type { Fetcher } from './Fetcher'
import type { ApiResponse, InteractionResponseType } from './types'

export class UsersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public becomeVolunteer(): Promise<ApiResponse<{ success?: boolean }>> {
    return this.fetcher.post<{ success?: boolean }>('/api/users/become-volunteer')
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
