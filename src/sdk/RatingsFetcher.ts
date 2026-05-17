import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  RatingResponseType,
  RatingSubmissionPayloadType,
  RatingSummaryType,
} from './types'

export class RatingsFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public create(
    payload: RatingSubmissionPayloadType,
  ): Promise<ApiResponse<RatingResponseType>> {
    return this.fetcher.post<RatingResponseType>('/api/ratings', payload)
  }

  public getForUser(userId: string): Promise<ApiResponse<RatingResponseType[]>> {
    return this.fetcher.get<RatingResponseType[]>(`/api/ratings/user/${userId}`)
  }

  public getSummaryForUser(userId: string): Promise<ApiResponse<RatingSummaryType>> {
    return this.fetcher.get<RatingSummaryType>(`/api/ratings/user/${userId}/summary`)
  }
}
