import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface CreateNotificationInput {
  userId: string | number;
  notificationType: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string | number;
  actionUrl?: string;
}

export interface GetNotificationsOptions {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationDetail {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

async function resolveDbUserId(userIdStr: string | number): Promise<number> {
  if (typeof userIdStr === 'number' && userIdStr > 0) {
    return userIdStr;
  }
  const directId = parseInt(String(userIdStr), 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    return directId;
  }

  const cleanMobile = String(userIdStr).replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  if (searchMobile) {
    const userByMobile = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WHERE Mobile = @mobile',
      [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

function mapDbRowToNotification(row: any): NotificationDetail {
  return {
    id: String(row.NotificationId),
    userId: String(row.UserId),
    notificationType: row.NotificationType || 'SYSTEM',
    title: row.Title || 'System Notification',
    message: row.Message || '',
    referenceType: row.ReferenceType || undefined,
    referenceId: row.ReferenceId ? String(row.ReferenceId) : undefined,
    actionUrl: row.ActionUrl || undefined,
    isRead: Boolean(row.IsRead),
    readAt: row.ReadAt ? new Date(row.ReadAt).toISOString() : undefined,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

export const notificationService = {
  /**
   * Helper method to generate notifications from domain events with event duplicate prevention
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationDetail | null> {
    const recipientUserId = await resolveDbUserId(input.userId);
    if (!recipientUserId) {
      logger.warn('Skipped notification creation: Invalid recipient user ID', { userId: input.userId });
      return null;
    }

    const nType = (input.notificationType || 'SYSTEM').toUpperCase().trim();
    const refType = input.referenceType || null;
    const refId = input.referenceId ? parseInt(String(input.referenceId).replace(/\D/g, ''), 10) : null;

    // Event Duplicate Prevention check
    if (refType && refId) {
      const dupCheck = await databaseService.query<any>(
        `SELECT TOP 1 NotificationId, UserId, NotificationType, Title, Message, ReferenceType, ReferenceId, ActionUrl, IsRead, ReadAt, CreatedAt 
         FROM Notifications 
         WHERE UserId = @uId AND NotificationType = @nType AND ReferenceType = @refType AND ReferenceId = @refId`,
        [
          { name: 'uId', type: mssql.BigInt(), value: recipientUserId },
          { name: 'nType', type: mssql.VarChar(50), value: nType },
          { name: 'refType', type: mssql.VarChar(50), value: refType },
          { name: 'refId', type: mssql.BigInt(), value: refId },
        ]
      );

      if (dupCheck.recordset && dupCheck.recordset.length > 0) {
        return mapDbRowToNotification(dupCheck.recordset[0]);
      }
    }

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO Notifications (
           UserId, NotificationType, Title, Message, ReferenceType, ReferenceId, ActionUrl, IsRead, IsArchived, CreatedAt
         )
         OUTPUT INSERTED.NotificationId
         VALUES (
           @uId, @nType, @title, @msg, @refType, @refId, @actionUrl, 0, 0, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'uId', type: mssql.BigInt(), value: recipientUserId },
          { name: 'nType', type: mssql.VarChar(50), value: nType },
          { name: 'title', type: mssql.NVarChar(250), value: input.title },
          { name: 'msg', type: mssql.NVarChar(1000), value: input.message },
          { name: 'refType', type: mssql.VarChar(50), value: refType },
          { name: 'refId', type: mssql.BigInt(), value: refId },
          { name: 'actionUrl', type: mssql.NVarChar(1000), value: input.actionUrl || null },
        ]
      );

      const createdId = Number(insertRes.recordset[0].NotificationId);
      const createdRes = await databaseService.query<any>(
        'SELECT NotificationId, UserId, NotificationType, Title, Message, ReferenceType, ReferenceId, ActionUrl, IsRead, ReadAt, CreatedAt FROM Notifications WHERE NotificationId = @nId',
        [{ name: 'nId', type: mssql.BigInt(), value: createdId }]
      );

      return mapDbRowToNotification(createdRes.recordset[0]);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create notification', { input, error: err.message });
      return null;
    }
  },

  /**
   * Fetch authenticated user's notifications with pagination
   */
  async getNotifications(
    requestingUserId: string,
    options: GetNotificationsOptions = {}
  ): Promise<{ notifications: NotificationDetail[]; unreadCount: number; total: number }> {
    const dbUserId = await resolveDbUserId(requestingUserId);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const offset = (page - 1) * limit;

    try {
      const unreadRes = await databaseService.query<any>(
        'SELECT COUNT(*) AS UnreadCount FROM Notifications WHERE UserId = @uId AND IsRead = 0 AND IsArchived = 0',
        [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
      );
      const unreadCount = unreadRes.recordset && unreadRes.recordset[0] ? Number(unreadRes.recordset[0].UnreadCount) : 0;

      const totalRes = await databaseService.query<any>(
        'SELECT COUNT(*) AS TotalCount FROM Notifications WHERE UserId = @uId AND IsArchived = 0',
        [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
      );
      const total = totalRes.recordset && totalRes.recordset[0] ? Number(totalRes.recordset[0].TotalCount) : 0;

      const notifsRes = await databaseService.query<any>(
        `SELECT NotificationId, UserId, NotificationType, Title, Message, ReferenceType, ReferenceId, ActionUrl, IsRead, ReadAt, CreatedAt 
         FROM Notifications 
         WHERE UserId = @uId AND IsArchived = 0
         ORDER BY NotificationId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        [
          { name: 'uId', type: mssql.BigInt(), value: dbUserId },
          { name: 'offset', type: mssql.Int(), value: offset },
          { name: 'limit', type: mssql.Int(), value: limit },
        ]
      );

      const notifications = (notifsRes.recordset || []).map(mapDbRowToNotification);
      return { notifications, unreadCount, total };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query user notifications', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch unread notification count for authenticated user
   */
  async getUnreadCount(requestingUserId: string): Promise<number> {
    const dbUserId = await resolveDbUserId(requestingUserId);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const res = await databaseService.query<any>(
        'SELECT COUNT(*) AS UnreadCount FROM Notifications WHERE UserId = @uId AND IsRead = 0 AND IsArchived = 0',
        [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
      );
      return res.recordset && res.recordset[0] ? Number(res.recordset[0].UnreadCount) : 0;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query unread count', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch single notification detail with recipient authorization
   */
  async getNotificationById(notificationIdStr: string, requestingUserId: string): Promise<NotificationDetail | null> {
    const numericNotifId = parseInt(notificationIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericNotifId)) return null;

    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      const res = await databaseService.query<any>(
        'SELECT NotificationId, UserId, NotificationType, Title, Message, ReferenceType, ReferenceId, ActionUrl, IsRead, ReadAt, CreatedAt FROM Notifications WHERE NotificationId = @nId',
        [{ name: 'nId', type: mssql.BigInt(), value: numericNotifId }]
      );

      if (!res.recordset || res.recordset.length === 0) {
        return null;
      }

      const row = res.recordset[0];
      if (Number(row.UserId) !== dbUserId) {
        throw new Error('FORBIDDEN_NOTIFICATION_ACCESS');
      }

      return mapDbRowToNotification(row);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_NOTIFICATION_ACCESS') throw err;
      logger.error('Failed to query notification by ID', { notificationIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Mark a single notification as read for authenticated user
   */
  async markAsRead(notificationIdStr: string, requestingUserId: string): Promise<NotificationDetail> {
    const existing = await this.getNotificationById(notificationIdStr, requestingUserId);
    if (!existing) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    const numericNotifId = parseInt(existing.id, 10);
    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      await databaseService.query(
        'UPDATE Notifications SET IsRead = 1, ReadAt = CURRENT_TIMESTAMP WHERE NotificationId = @nId AND UserId = @uId',
        [
          { name: 'nId', type: mssql.BigInt(), value: numericNotifId },
          { name: 'uId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      const updated = await this.getNotificationById(notificationIdStr, requestingUserId);
      if (!updated) {
        throw new Error('Notification marked read but failed to reload record');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to mark notification as read', { notificationIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Mark all notifications as read for authenticated user
   */
  async markAllAsRead(requestingUserId: string): Promise<{ message: string; updatedCount: number }> {
    const dbUserId = await resolveDbUserId(requestingUserId);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const countRes = await databaseService.query<any>(
        'SELECT COUNT(*) AS UnreadCount FROM Notifications WHERE UserId = @uId AND IsRead = 0 AND IsArchived = 0',
        [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
      );
      const unreadCount = countRes.recordset && countRes.recordset[0] ? Number(countRes.recordset[0].UnreadCount) : 0;

      if (unreadCount > 0) {
        await databaseService.query(
          'UPDATE Notifications SET IsRead = 1, ReadAt = CURRENT_TIMESTAMP WHERE UserId = @uId AND IsRead = 0 AND IsArchived = 0',
          [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
        );
      }

      return { message: 'All notifications marked as read', updatedCount: unreadCount };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to mark all notifications as read', { requestingUserId, error: err.message });
      throw err;
    }
  },
};
