import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { customerDashboardService } from '../services/customerDashboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const customerDashboardController = {
  /**
   * GET /api/customer/dashboard
   */
  getDashboardData: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required to view customer dashboard', 401);
    }

    try {
      const data = await customerDashboardService.getDashboardData(req.user.userId);
      return sendSuccess(res, data);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UNAUTHORIZED')) {
        return sendError(res, 'UNAUTHORIZED', err.message, 401);
      }
      if (err.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch customer dashboard data', 500);
    }
  },
};
