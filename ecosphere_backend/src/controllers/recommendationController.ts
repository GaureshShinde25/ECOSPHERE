import { Request, Response } from 'express';
import { recommendationEngineService } from '../services/recommendationEngineService.js';
import { OpportunityType } from '../services/opportunityEngineService.js';
import { logger } from '../utils/logger.js';

export const recommendationController = {
  /**
   * GET /api/recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = authUser?.userId ? String(authUser.userId) : '';
      const type = req.query.type ? (String(req.query.type).toUpperCase() as OpportunityType) : undefined;
      const city = req.query.city ? String(req.query.city) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

      const result = await recommendationEngineService.getPersonalizedRecommendations({
        userIdStr,
        type,
        city,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.recommendations,
        total: result.total,
        userContext: result.userContext,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error fetching personalized recommendations', { error: err.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate personalized recommendations',
        },
      });
    }
  },
};
