import type { Fetcher } from './Fetcher'
import type { ApiResponse, UploadResponseEnvelopeType } from './types'

export class UploadsFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public uploadAudio(file: File): Promise<ApiResponse<UploadResponseEnvelopeType>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.fetcher.post<UploadResponseEnvelopeType>('/api/uploads/audio', formData)
  }
}
