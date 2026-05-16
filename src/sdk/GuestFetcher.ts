import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  GuestSessionResponseType,
  PaginatedTaskListType,
  TaskSubmissionPayloadType,
  TaskResponseType,
} from './types'

export class GuestFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public createSession(): Promise<ApiResponse<GuestSessionResponseType>> {
    return this.fetcher.post<GuestSessionResponseType>('/api/guest/session')
  }

  public createTask(
    sessionId: string,
    payload: TaskSubmissionPayloadType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.post<TaskResponseType>('/api/guest/tasks', payload, {
      headers: {
        'X-Guest-Session': sessionId,
      },
    })
  }

  public listTasks(
    sessionId: string,
    query?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<ApiResponse<PaginatedTaskListType>> {
    return this.fetcher.get<PaginatedTaskListType>('/api/guest/tasks', {
      headers: {
        'X-Guest-Session': sessionId,
      },
      query,
    })
  }

  public deleteTask(sessionId: string, taskId: string): Promise<ApiResponse<unknown>> {
    return this.fetcher.delete<unknown>(`/api/guest/tasks/${taskId}`, undefined, {
      headers: {
        'X-Guest-Session': sessionId,
      },
    })
  }
}
