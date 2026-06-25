import { api, unwrap } from "@/services/api";
import type {
  ApiResponse,
  NotificationResponse,
  PageResponse,
} from "@/types";

export interface NotificationSearchParams {
  page?: number;
  size?: number;
}

export const notificationsService = {
  list: (params: NotificationSearchParams = {}) =>
    unwrap<PageResponse<NotificationResponse>>(
      api.get<ApiResponse<PageResponse<NotificationResponse>>>("/api/notifications", {
        params,
      }),
    ),

  unreadCount: () =>
    unwrap<{ count: number }>(
      api.get<ApiResponse<{ count: number }>>("/api/notifications/unread-count"),
    ),

  markRead: (id: number) =>
    unwrap<NotificationResponse>(
      api.post<ApiResponse<NotificationResponse>>(`/api/notifications/${id}/read`),
    ),

  markAllRead: () =>
    unwrap<{ updated: number }>(
      api.post<ApiResponse<{ updated: number }>>("/api/notifications/read-all"),
    ),
};
