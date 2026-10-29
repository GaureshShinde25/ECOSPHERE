import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { sellerDashboardService } from '../services/sellerDashboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const sellerDashboardController = {
  /**
   * GET /api/seller/dashboard
   */
  getDashboardData: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to view seller dashboard', 401);
    }

    try {
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const data = await sellerDashboardService.getDashboardData(req.user.userId, businessId);
      return sendSuccess(res, data);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UNAUTHORIZED')) {
        return sendError(res, 'UNAUTHORIZED', err.message, 401);
      }
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch seller dashboard telemetry', 500);
    }
  },
};
