import { Request, Response } from 'express';
import { decisionIntelligenceService } from '../services/decisionIntelligenceService.js';
import { logger } from '../utils/logger.js';

export const decisionIntelligenceController = {
  /**
   * GET /api/decision-intelligence/opportunities
   */
  async getOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = authUser?.userId ? String(authUser.userId) : undefined;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const limit = isNaN(rawLimit) || rawLimit <= 0 ? 5 : Math.min(20, rawLimit);

      const result = await decisionIntelligenceService.getRankedDecisionOpportunities({ userIdStr, limit });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in decisionIntelligenceController.getOpportunities', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve decision opportunities.' },
      });
    }
  },

  /**
   * GET /api/decision-intelligence/compare
   */
  async compare(req: Request, res: Response): Promise<void> {
    try {
      const categoryA = (req.query.categoryA as string) || 'Cleaning Services';
      const categoryB = (req.query.categoryB as string) || 'Tutoring Services';
      const city = (req.query.city as string) || 'Kolkata';

      const result = await decisionIntelligenceService.compareOpportunities(categoryA, categoryB, city);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in decisionIntelligenceController.compare', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to compare opportunities.' },
      });
    }
  },

  /**
   * GET /api/decision-intelligence/employment
   */
  async getEmployment(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const result = await decisionIntelligenceService.getEmploymentCreationIntelligence(city);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in decisionIntelligenceController.getEmployment', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve employment intelligence.' },
      });
    }
  },
};
