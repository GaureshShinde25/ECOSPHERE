import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { favoriteService } from '../services/favoriteService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const favoriteController = {
  /**
   * GET /api/favorites
   */
  getFavorites: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to view favorites', 401);
    }

    try {
      const result = await favoriteService.getFavorites(req.user.userId);
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve favorites', 500);
    }
  },

  /**
   * GET /api/favorites/:entityType/:entityId
   */
  checkFavorite: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const entityType = String(req.params.entityType || '');
    const entityId = String(req.params.entityId || '');
    if (!entityType || !entityId) {
      return sendError(res, 'INVALID_INPUT', 'Entity type and ID are required', 400);
    }

    try {
      const result = await favoriteService.isFavorite(req.user.userId, entityType, entityId);
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to check favorite status', 500);
    }
  },

  /**
   * POST /api/favorites
   * Body: { entityType: 'service'|'product'|'job'|'business', entityId: string }
   */
  addFavorite: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to save favorites', 401);
    }

    const { entityType, entityId } = req.body;
    if (!entityType || !entityId) {
      return sendError(res, 'INVALID_INPUT', 'entityType and entityId are required', 400);
    }

    try {
      const result = await favoriteService.addFavorite(req.user.userId, String(entityType), String(entityId));
      return sendSuccess(res, result, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('ENTITY_NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('INVALID_ENTITY_TYPE') || err.message.includes('INVALID_ENTITY_ID')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'SAVE_FAILED', err.message || 'Failed to add item to favorites', 400);
    }
  },

  /**
   * DELETE /api/favorites/:entityType/:entityId
   */
  removeFavorite: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const entityType = String(req.params.entityType || '');
    const entityId = String(req.params.entityId || '');
    if (!entityType || !entityId) {
      return sendError(res, 'INVALID_INPUT', 'Entity type and ID are required', 400);
    }

    try {
      const result = await favoriteService.removeFavorite(req.user.userId, entityType, entityId);
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'REMOVE_FAILED', err.message || 'Failed to remove item from favorites', 400);
    }
  },
};
