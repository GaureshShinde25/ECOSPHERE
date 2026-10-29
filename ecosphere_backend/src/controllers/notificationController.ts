import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { notificationService } from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const notificationController = {
  getNotifications: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

      const result = await notificationService.getNotifications(req.user.userId, { page, limit });
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve notifications', 500);
    }
  },

  getUnreadCount: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const unreadCount = await notificationService.getUnreadCount(req.user.userId);
      return sendSuccess(res, { unreadCount });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve unread notification count', 500);
    }
  },

  getNotificationById: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Notification ID is required', 400);
    }

    try {
      const notification = await notificationService.getNotificationById(String(rawId), req.user.userId);
      if (!notification) {
        return sendError(res, 'NOT_FOUND', `Notification with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_NOTIFICATION_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only access your own notification records.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve notification details', 500);
    }
  },

  markAsRead: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Notification ID is required', 400);
    }

    try {
      const notification = await notificationService.markAsRead(String(rawId), req.user.userId);
      return sendSuccess(res, { message: 'Notification marked as read', notification });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'NOTIFICATION_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Notification with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_NOTIFICATION_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only modify your own notifications.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to mark notification as read', 400);
    }
  },

  markAllAsRead: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const result = await notificationService.markAllAsRead(req.user.userId);
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to mark all notifications as read', 500);
    }
  },
};
