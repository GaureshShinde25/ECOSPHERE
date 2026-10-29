import { Request, Response } from 'express';
import { trendIntelligenceService } from '../services/trendIntelligenceService.js';
import { logger } from '../utils/logger.js';

export const trendIntelligenceController = {
  /**
   * GET /api/trends/categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const trends = await trendIntelligenceService.getCategoryTrends(city);

      res.status(200).json({
        success: true,
        data: { trends, city, timeWindow: 'Trailing 14 Days' },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in trendIntelligenceController.getCategories', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve category trends.' },
      });
    }
  },

  /**
   * GET /api/trends/emerging
   */
  async getEmerging(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const emerging = await trendIntelligenceService.getEmergingDemand(city);

      res.status(200).json({
        success: true,
        data: { emerging, city },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in trendIntelligenceController.getEmerging', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve emerging demand.' },
      });
    }
  },

  /**
   * GET /api/trends/declining
   */
  async getDeclining(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const declining = await trendIntelligenceService.getDecliningDemand(city);

      res.status(200).json({
        success: true,
        data: { declining, city },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in trendIntelligenceController.getDeclining', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve declining demand.' },
      });
    }
  },

  /**
   * GET /api/trends/patterns
   */
  async getPatterns(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const patterns = await trendIntelligenceService.getWeeklyActivityPattern(city);

      res.status(200).json({
        success: true,
        data: { patterns, city },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in trendIntelligenceController.getPatterns', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve weekly patterns.' },
      });
    }
  },

  /**
   * GET /api/trends/opportunities
   */
  async getOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = authUser?.userId ? String(authUser.userId) : undefined;
      const momentum = await trendIntelligenceService.getOpportunityMomentum(userIdStr);

      res.status(200).json({
        success: true,
        data: { momentum },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in trendIntelligenceController.getOpportunities', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve opportunity momentum.' },
      });
    }
  },
};
