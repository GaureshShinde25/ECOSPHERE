import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { communityService } from '../services/communityService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const communityController = {
  /**
   * GET /api/community/posts
   */
  getPosts: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const postType = req.query.postType ? String(req.query.postType) : undefined;
      const q = req.query.q ? String(req.query.q) : undefined;
      const userIdStr = (req as AuthenticatedRequest).user?.userId;

      const result = await communityService.getPosts({ page, limit, postType, q, userIdStr });
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch community posts', 500);
    }
  },

  /**
   * GET /api/community/posts/:id
   */
  getPostById: async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const userIdStr = (req as AuthenticatedRequest).user?.userId;

    try {
      const result = await communityService.getPostById(String(id), userIdStr);
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch post', 500);
    }
  },

  /**
   * POST /api/community/posts
   */
  createPost: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to create a post', 401);
    }

    const { postText, postType, visibility, businessId } = req.body;
    if (!postText) {
      return sendError(res, 'INVALID_INPUT', 'postText is required', 400);
    }

    try {
      const result = await communityService.createPost(req.user.userId, {
        postText: String(postText),
        postType: postType ? String(postType) : undefined,
        visibility: visibility ? String(visibility) : undefined,
        businessId: businessId ? String(businessId) : undefined,
      });
      return sendSuccess(res, result, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('INVALID_INPUT')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create post', 400);
    }
  },

  /**
   * PUT /api/community/posts/:id
   */
  updatePost: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to edit a post', 401);
    }

    const { id } = req.params;
    const { postText, postType } = req.body;

    try {
      const result = await communityService.updatePost(req.user.userId, String(id), {
        postText: String(postText || ''),
        postType: postType ? String(postType) : undefined,
      });
      return sendSuccess(res, result);
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
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update post', 400);
    }
  },

  /**
   * DELETE /api/community/posts/:id
   */
  deletePost: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to delete a post', 401);
    }

    const { id } = req.params;

    try {
      const result = await communityService.deletePost(req.user.userId, String(id));
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'DELETE_FAILED', err.message || 'Failed to delete post', 400);
    }
  },

  /**
   * POST /api/community/posts/:id/like
   */
  toggleLike: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to like a post', 401);
    }

    const { id } = req.params;

    try {
      const result = await communityService.togglePostLike(req.user.userId, String(id));
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'LIKE_FAILED', err.message || 'Failed to toggle like', 400);
    }
  },

  /**
   * GET /api/community/posts/:postId/comments
   */
  getComments: async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;
    const userIdStr = (req as AuthenticatedRequest).user?.userId;

    try {
      const comments = await communityService.getComments(String(postId), userIdStr);
      return sendSuccess(res, { comments, count: comments.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch comments', 500);
    }
  },

  /**
   * POST /api/community/posts/:postId/comments
   */
  createComment: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to comment', 401);
    }

    const { postId } = req.params;
    const { commentText, parentCommentId } = req.body;

    if (!commentText) {
      return sendError(res, 'INVALID_INPUT', 'commentText is required', 400);
    }

    try {
      const result = await communityService.createComment(
        req.user.userId,
        String(postId),
        String(commentText),
        parentCommentId ? String(parentCommentId) : undefined
      );
      return sendSuccess(res, result, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('INVALID_INPUT')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'COMMENT_FAILED', err.message || 'Failed to add comment', 400);
    }
  },

  /**
   * PUT /api/community/comments/:id
   */
  updateComment: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to edit a comment', 401);
    }

    const { id } = req.params;
    const { commentText } = req.body;

    try {
      const result = await communityService.updateComment(req.user.userId, String(id), String(commentText || ''));
      return sendSuccess(res, result);
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
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update comment', 400);
    }
  },

  /**
   * DELETE /api/community/comments/:id
   */
  deleteComment: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to delete a comment', 401);
    }

    const { id } = req.params;

    try {
      const result = await communityService.deleteComment(req.user.userId, String(id));
      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'DELETE_FAILED', err.message || 'Failed to delete comment', 400);
    }
  },
};
