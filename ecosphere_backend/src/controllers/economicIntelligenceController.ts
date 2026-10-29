import { Request, Response } from 'express';
import { economicIntelligenceService, InsightType } from '../services/economicIntelligenceService.js';
import { logger } from '../utils/logger.js';

export const economicIntelligenceController = {
  /**
   * GET /api/economic-intelligence
   */
  async getEconomicInsights(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city ? String(req.query.city) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;
      const type = req.query.type ? (String(req.query.type).toUpperCase() as InsightType) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

      const result = await economicIntelligenceService.getEconomicInsights({
        city,
        category,
        type,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.insights,
        total: result.total,
        cityContext: result.cityContext,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error fetching economic intelligence insights', { error: err.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate economic intelligence insights',
        },
      });
    }
  },
};
