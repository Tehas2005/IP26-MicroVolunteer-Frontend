import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  DeleteTaskResponseType,
  DeleteTaskDetailsResponseType,
  PaginatedTaskListType,
  TaskDetailsPayloadType,
  TaskFiltersType,
  TaskResponseType,
  TaskStatusPayloadType,
  TaskSubmissionPayloadType,
} from './types'

export class TasksFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public create(payload: TaskSubmissionPayloadType): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.post<TaskResponseType>('/api/tasks', payload)
  }

  public list(filters?: TaskFiltersType): Promise<ApiResponse<PaginatedTaskListType>> {
    return this.fetcher.get<PaginatedTaskListType>('/api/tasks', { query: filters })
  }

  public listGuest(
    guestSessionId: string,
    filters?: TaskFiltersType,
  ): Promise<ApiResponse<PaginatedTaskListType>> {
    return this.fetcher.get<PaginatedTaskListType>('/api/guest/tasks', {
      headers: {
        'X-Guest-Session': guestSessionId,
      },
      query: filters,
    })
  }

  public getById(id: string): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.get<TaskResponseType>(`/api/tasks/${id}`)
  }

  public updateStatus(
    id: string,
    payload: TaskStatusPayloadType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.patch<TaskResponseType>(`/api/tasks/${id}/status`, payload)
  }

  public updateDetails(
    id: string,
    payload: TaskDetailsPayloadType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.put<TaskResponseType>(`/api/tasks/${id}/details`, payload)
  }

  public deleteDetails(id: string): Promise<ApiResponse<DeleteTaskDetailsResponseType>> {
    return this.fetcher.delete<DeleteTaskDetailsResponseType>(`/api/tasks/${id}/details`)
  }

  public delete(id: string): Promise<ApiResponse<DeleteTaskResponseType>> {
    return this.fetcher.delete<DeleteTaskResponseType>(`/api/tasks/${id}`)
  }

  public deleteGuest(
    id: string,
    guestSessionId: string,
  ): Promise<ApiResponse<DeleteTaskResponseType>> {
    return this.fetcher.delete<DeleteTaskResponseType>(`/api/guest/tasks/${id}`, undefined, {
      headers: {
        'X-Guest-Session': guestSessionId,
      },
    })
  }
}
