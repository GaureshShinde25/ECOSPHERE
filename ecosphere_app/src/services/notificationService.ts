import { AppNotification } from '../types';
import { apiClient } from './apiClient';

export interface GetNotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
}

export const notificationService = {
  /**
   * Fetch authenticated user's notifications from GET /api/notifications
   */
  async getNotifications(page = 1, limit = 50): Promise<{ notifications: AppNotification[]; unreadCount: number; total: number }> {
    try {
      const response = await apiClient.get<GetNotificationsResponse>(`/notifications?page=${page}&limit=${limit}`, {
        requiresAuth: true,
      });
      if (response && response.notifications && Array.isArray(response.notifications)) {
        return {
          notifications: response.notifications,
          unreadCount: response.unreadCount || 0,
          total: response.total || response.notifications.length,
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[notificationService.getNotifications] Error fetching notifications', error);
      }
    }
    return { notifications: [], unreadCount: 0, total: 0 };
  },

  /**
   * Fetch unread notification count from GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ success: boolean; unreadCount: number }>('/notifications/unread-count', {
        requiresAuth: true,
      });
      if (response && typeof response.unreadCount === 'number') {
        return response.unreadCount;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[notificationService.getUnreadCount] Error fetching unread count', error);
      }
    }
    return 0;
  },

  /**
   * Fetch single notification detail from GET /api/notifications/:id
   */
  async getNotificationById(id: string): Promise<AppNotification | undefined> {
    try {
      const response = await apiClient.get<{ success: boolean; notification: AppNotification }>(`/notifications/${id}`, {
        requiresAuth: true,
      });
      if (response && response.notification) {
        return response.notification;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[notificationService.getNotificationById] Error fetching notification ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Mark a single notification as read on backend PUT /api/notifications/:id/read
   */
  async markAsRead(id: string): Promise<AppNotification> {
    const response = await apiClient.put<{ success: boolean; notification: AppNotification }>(`/notifications/${id}/read`, {}, {
      requiresAuth: true,
    });
    if (response && response.notification) {
      return response.notification;
    }
    throw new Error('Failed to mark notification as read');
  },

  /**
   * Mark all user's notifications as read on backend PUT /api/notifications/read-all
   */
  async markAllAsRead(): Promise<{ message: string; updatedCount: number }> {
    const response = await apiClient.put<{ success: boolean; message: string; updatedCount: number }>('/notifications/read-all', {}, {
      requiresAuth: true,
    });
    if (response) {
      return { message: response.message, updatedCount: response.updatedCount || 0 };
    }
    throw new Error('Failed to mark all notifications as read');
  },
};
