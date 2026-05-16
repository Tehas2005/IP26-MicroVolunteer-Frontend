import type { Fetcher } from './Fetcher'
import type { ApiResponse } from './types'

type VolunteerOffersListResponseType = {
  data: unknown[]
  meta?: Record<string, unknown> | null
}

export class OffersFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public readonly getMine = async (
    page = 1,
    pageSize = 1,
  ): Promise<ApiResponse<VolunteerOffersListResponseType>> => {
    return this.fetcher.get<VolunteerOffersListResponseType>('/api/offers', {
      query: { page, pageSize },
    })
  }
}
