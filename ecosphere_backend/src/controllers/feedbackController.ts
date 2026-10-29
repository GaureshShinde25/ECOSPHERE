import { Request, Response } from 'express';
import { feedbackService } from '../services/feedbackService.js';
import { logger } from '../utils/logger.js';

export class FeedbackController {
  /**
   * GET /api/feedback/summary
   * Returns aggregate feedback intelligence across the platform / city.
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city as string | undefined;
      const summary = await feedbackService.getFeedbackSummary(city);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      logger.error('Error in getSummary feedback controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve feedback summary', error: err.message });
    }
  }

  /**
   * GET /api/feedback/categories
   * Returns category-level feedback across Jobs, Services, and Retail.
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city as string | undefined;
      const [jobs, services, retail] = await Promise.all([
        feedbackService.getJobCategoryFeedback(city),
        feedbackService.getServiceCategoryFeedback(city),
        feedbackService.getRetailCategoryFeedback(city),
      ]);

      res.json({
        success: true,
        data: {
          city: city || 'GLOBAL',
          jobs,
          services,
          retail,
        },
      });
    } catch (err: any) {
      logger.error('Error in getCategories feedback controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve category feedback', error: err.message });
    }
  }

  /**
   * GET /api/feedback/services
   * Returns service fulfillment feedback by category.
   */
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city as string | undefined;
      const serviceFeedback = await feedbackService.getServiceCategoryFeedback(city);
      res.json({ success: true, data: serviceFeedback });
    } catch (err: any) {
      logger.error('Error in getServices feedback controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve service feedback', error: err.message });
    }
  }

  /**
   * GET /api/feedback/jobs
   * Returns job outcome feedback by category.
   */
  async getJobs(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city as string | undefined;
      const jobFeedback = await feedbackService.getJobCategoryFeedback(city);
      res.json({ success: true, data: jobFeedback });
    } catch (err: any) {
      logger.error('Error in getJobs feedback controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve job feedback', error: err.message });
    }
  }

  /**
   * GET /api/feedback/:category
   * Returns detailed cross-domain feedback for a specific category.
   */
  async getCategoryDetail(req: Request, res: Response): Promise<void> {
    try {
      const rawCategory = req.params.category;
      const category = Array.isArray(rawCategory) ? rawCategory[0] : String(rawCategory || '');
      if (!category) {
        res.status(400).json({ success: false, message: 'Category parameter is required' });
        return;
      }
      const city = req.query.city as string | undefined;
      const detail = await feedbackService.getCategoryDeepDive(category, city);
      res.json({ success: true, data: detail });
    } catch (err: any) {
      logger.error('Error in getCategoryDetail feedback controller', { error: err.message, category: String(req.params.category) });
      res.status(500).json({ success: false, message: 'Failed to retrieve category feedback detail', error: err.message });
    }
  }
}

export const feedbackController = new FeedbackController();
