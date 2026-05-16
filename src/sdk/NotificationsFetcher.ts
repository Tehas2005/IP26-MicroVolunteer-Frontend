import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  NotificationFiltersType,
  NotificationMarkAllReadResponseType,
  NotificationResponseType,
  PaginatedNotificationListType,
} from './types'

export class NotificationsFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public list(
    filters?: NotificationFiltersType,
  ): Promise<ApiResponse<PaginatedNotificationListType>> {
    return this.fetcher.get<PaginatedNotificationListType>('/api/notifications', {
      query: filters,
    })
  }

  public markRead(id: string): Promise<ApiResponse<NotificationResponseType>> {
    return this.fetcher.patch<NotificationResponseType>(`/api/notifications/${id}/read`)
  }

  public markAllRead(): Promise<ApiResponse<NotificationMarkAllReadResponseType>> {
    return this.fetcher.patch<NotificationMarkAllReadResponseType>('/api/notifications/read-all')
  }
}
