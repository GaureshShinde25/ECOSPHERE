import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { reviewService } from '../services/reviewService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const reviewController = {
  getReviews: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const targetType = req.query.targetType ? String(req.query.targetType) : undefined;
      const targetId = req.query.targetId ? String(req.query.targetId) : undefined;
      const userId = req.query.userId ? String(req.query.userId) : undefined;

      const result = await reviewService.getReviews({ targetType, targetId, userId, page, limit });
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve reviews', 500);
    }
  },

  getMyReviews: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const reviews = await reviewService.getMyReviews(req.user.userId);
      return sendSuccess(res, { reviews });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve my reviews', 500);
    }
  },

  getReviewById: async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Review ID is required', 400);
    }

    try {
      const review = await reviewService.getReviewById(String(rawId));
      if (!review) {
        return sendError(res, 'NOT_FOUND', `Review with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { review });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve review detail', 500);
    }
  },

  createReview: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const { targetType, targetId, rating, title, reviewText } = req.body;
    if (!targetType || targetId === undefined || rating === undefined) {
      return sendError(res, 'MISSING_FIELDS', 'targetType, targetId, and rating are required fields', 400);
    }

    try {
      const created = await reviewService.createReview(req.user.userId, {
        targetType,
        targetId,
        rating: Number(rating),
        title,
        reviewText,
      });
      return sendSuccess(res, { message: 'Review published successfully', review: created }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('DUPLICATE_REVIEW')) {
        return sendError(res, 'DUPLICATE_REVIEW', err.message, 400);
      }
      if (err.message.includes('INVALID_RATING')) {
        return sendError(res, 'INVALID_RATING', err.message, 400);
      }
      if (err.message.includes('INVALID_TARGET') || err.message.includes('TARGET_NOT_FOUND')) {
        return sendError(res, 'INVALID_TARGET', err.message, 400);
      }
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to publish review', 400);
    }
  },

  updateReview: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Review ID is required', 400);
    }

    const { rating, title, reviewText } = req.body;

    try {
      const updated = await reviewService.updateReview(String(rawId), req.user.userId, {
        rating: rating !== undefined ? Number(rating) : undefined,
        title,
        reviewText,
      });
      return sendSuccess(res, { message: 'Review updated successfully', review: updated });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'REVIEW_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Review with ID ${rawId} not found`, 404);
      }
      if (err.message.includes('FORBIDDEN_REVIEW_MODIFICATION')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      if (err.message.includes('INVALID_RATING')) {
        return sendError(res, 'INVALID_RATING', err.message, 400);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update review', 400);
    }
  },

  deleteReview: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Review ID is required', 400);
    }

    try {
      await reviewService.deleteReview(String(rawId), req.user.userId, req.user.role);
      return sendSuccess(res, { message: 'Review deleted successfully' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'REVIEW_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Review with ID ${rawId} not found`, 404);
      }
      if (err.message.includes('FORBIDDEN_REVIEW_MODIFICATION')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'DELETE_FAILED', err.message || 'Failed to delete review', 400);
    }
  },
};
