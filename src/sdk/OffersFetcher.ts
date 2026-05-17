import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  OfferFiltersType,
  OfferStatusPayloadType,
  OfferSubmissionPayloadType,
  PaginatedOfferListType,
} from './types'

export class OffersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public createForTask(
    taskId: string,
    payload: OfferSubmissionPayloadType,
  ): Promise<ApiResponse<unknown>> {
    return this.fetcher.post<unknown>(`/api/tasks/${taskId}/offers`, payload)
  }

  public listForTask(
    taskId: string,
    filters?: OfferFiltersType,
  ): Promise<ApiResponse<PaginatedOfferListType>> {
    return this.fetcher.get<PaginatedOfferListType>(`/api/tasks/${taskId}/offers`, {
      query: filters,
    })
  }

  public listMine(filters?: OfferFiltersType): Promise<ApiResponse<PaginatedOfferListType>> {
    return this.fetcher.get<PaginatedOfferListType>('/api/offers', { query: filters })
  }

  // public createForTask(
  //   taskId: string,
  //   payload: OfferSubmissionPayloadType,
  // ): Promise<ApiResponse<OfferResponseType>> {
  //   return this.fetcher.post<OfferResponseType>(`/api/tasks/${taskId}/offers`, payload)
  // }

  public updateStatus(
    offerId: string,
    payload: OfferStatusPayloadType,
  ): Promise<ApiResponse<unknown>> {
    return this.fetcher.patch<unknown>(`/api/offers/${offerId}/status`, payload)
  }

  public delete(offerId: string): Promise<ApiResponse<unknown>> {
    return this.fetcher.delete<unknown>(`/api/offers/${offerId}`)
  }
}
