import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  DeleteTaskDetailsResponseType,
  FetcherRequestOptionsType,
  PaginatedTaskListType,
  TaskDetailsPayloadType,
  TaskFiltersType,
  TaskMessageResponseType,
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

  public getById(
    id: string,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.get<TaskResponseType>(`/api/tasks/${id}`, options)
  }

  public getMessages(
    id: string,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<TaskMessageResponseType[]>> {
    return this.fetcher.get<TaskMessageResponseType[]>(`/api/tasks/${id}/messages`, options)
  }

  public updateStatus(
    id: string,
    payload: TaskStatusPayloadType,
    options?: FetcherRequestOptionsType,
  ): Promise<ApiResponse<TaskResponseType>> {
    return this.fetcher.patch<TaskResponseType>(`/api/tasks/${id}/status`, payload, options)
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
}
