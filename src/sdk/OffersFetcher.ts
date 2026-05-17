import type { Fetcher } from './Fetcher'
import type { ApiResponse, OfferResponseType, OfferStatusPayloadType } from './types'

export class OffersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public updateStatus(
    id: string,
    payload: OfferStatusPayloadType,
  ): Promise<ApiResponse<OfferResponseType>> {
    return this.fetcher.patch<OfferResponseType>(`/api/offers/${id}/status`, payload)
  }
}
