import type { Fetcher } from './Fetcher'
import type {
  ApiResponse,
  NotificationListResponseType,
  NotificationRecordType,
  NotificationsListFiltersType,
  ReadAllNotificationsResponseType,
} from './types'

export class NotificationsFetcher {
  constructor(private readonly fetcher: Fetcher) {}

  public list(
    filters?: NotificationsListFiltersType,
  ): Promise<ApiResponse<NotificationListResponseType>> {
    return this.fetcher.get<NotificationListResponseType>('/api/notifications', {
      query: filters,
      suppressUnauthorizedEvent: true,
    })
  }

  public markAsRead(id: string): Promise<ApiResponse<NotificationRecordType>> {
    return this.fetcher.patch<NotificationRecordType>(`/api/notifications/${id}/read`, undefined, {
      suppressUnauthorizedEvent: true,
    })
  }

  public markAllAsRead(): Promise<ApiResponse<ReadAllNotificationsResponseType>> {
    return this.fetcher.patch<ReadAllNotificationsResponseType>(
      '/api/notifications/read-all',
      undefined,
      {
        suppressUnauthorizedEvent: true,
      },
    )
  }
}
