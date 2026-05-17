import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  GuestSessionResponseType,
  GuestTaskSubmissionPayloadType,
  TaskFiltersType,
  TaskResponseType,
} from './types'

export class GuestFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public createSession(): Promise<ApiResponse<GuestSessionResponseType>> {
    return this.fetcher.post<GuestSessionResponseType>('/api/guest/session')
  }

  public createTask(
    sessionId: string,
    payload: GuestTaskSubmissionPayloadType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.post<TaskResponseType>('/api/guest/tasks', payload, {
      headers: {
        'X-Guest-Session': sessionId,
      },
    })
  }

  public listTasks(
    sessionId: string,
    filters?: TaskFiltersType,
  ): Promise<ApiResponse<unknown>> {
    return this.fetcher.get<unknown>('/api/guest/tasks', {
      headers: {
        'X-Guest-Session': sessionId,
      },
      query: filters,
    })
  }

  public deleteTask(sessionId: string, id: string): Promise<ApiResponse<null>> {
    return this.fetcher.delete<null>(`/api/guest/tasks/${id}`, undefined, {
      headers: {
        'X-Guest-Session': sessionId,
      },
    })
  }
}
