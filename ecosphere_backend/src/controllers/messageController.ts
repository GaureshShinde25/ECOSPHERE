import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { messageService } from '../services/messageService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const messageController = {
  /**
   * GET /api/messages/conversations
   */
  getConversations: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to view conversations', 401);
    }

    try {
      const conversations = await messageService.getConversations(req.user.userId);
      return sendSuccess(res, { conversations, total: conversations.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch conversations', 500);
    }
  },

  /**
   * POST /api/messages/conversations
   * Body: { targetUserId: string, referenceType?: string, referenceId?: string }
   */
  getOrCreateConversation: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const { targetUserId, referenceType, referenceId } = req.body;
    if (!targetUserId) {
      return sendError(res, 'INVALID_INPUT', 'targetUserId is required', 400);
    }

    try {
      const conversation = await messageService.getOrCreateConversation(
        req.user.userId,
        String(targetUserId),
        referenceType ? String(referenceType) : undefined,
        referenceId ? String(referenceId) : undefined
      );
      return sendSuccess(res, conversation, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('INVALID_INPUT')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to start conversation', 400);
    }
  },

  /**
   * GET /api/messages/conversations/:id
   */
  getMessages: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to view messages', 401);
    }

    const { id } = req.params;

    try {
      const messages = await messageService.getMessages(req.user.userId, String(id));
      return sendSuccess(res, { messages, total: messages.length });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UNAUTHORIZED')) {
        return sendError(res, 'UNAUTHORIZED', err.message, 401);
      }
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch messages', 500);
    }
  },

  /**
   * POST /api/messages/conversations/:id/messages
   * Body: { messageText: string, messageType?: string }
   */
  sendMessage: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to send message', 401);
    }

    const { id } = req.params;
    const { messageText, messageType } = req.body;

    if (!messageText) {
      return sendError(res, 'INVALID_INPUT', 'messageText is required', 400);
    }

    try {
      const message = await messageService.sendMessage(
        req.user.userId,
        String(id),
        String(messageText),
        messageType ? String(messageType) : 'text'
      );
      return sendSuccess(res, message, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      if (err.message.includes('INVALID_INPUT')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'SEND_FAILED', err.message || 'Failed to send message', 400);
    }
  },

  /**
   * PUT /api/messages/conversations/:id/read
   */
  markAsRead: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = req.params;

    try {
      const result = await messageService.markAsRead(req.user.userId, String(id));
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'MARK_FAILED', err.message || 'Failed to mark conversation as read', 400);
    }
  },

  /**
   * DELETE /api/messages/:id
   */
  deleteMessage: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = req.params;

    try {
      const result = await messageService.deleteMessage(req.user.userId, String(id));
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'DELETE_FAILED', err.message || 'Failed to delete message', 400);
    }
  },
};
