import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  OfferResponseType,
  OfferStatusPayloadType,
  OfferSubmissionPayloadType,
} from './types'

export class OffersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public createForTask(
    taskId: string,
    payload: OfferSubmissionPayloadType,
  ): Promise<ApiResponse<OfferResponseType>> {
    return this.fetcher.post<OfferResponseType>(`/api/tasks/${taskId}/offers`, payload)
  }

  public updateStatus(
    id: string,
    payload: OfferStatusPayloadType,
  ): Promise<ApiResponse<OfferResponseType>> {
    return this.fetcher.patch<OfferResponseType>(`/api/offers/${id}/status`, payload)
  }
}
