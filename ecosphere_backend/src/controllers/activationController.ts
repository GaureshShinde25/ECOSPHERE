import { Request, Response } from 'express';
import { activationService } from '../services/activationService.js';
import { logger } from '../utils/logger.js';

export class ActivationController {
  /**
   * GET /api/activation/next-actions
   * Returns prioritized, grounded Next Best Action cards for the user's role and city
   */
  async getNextBestActions(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = String(authUser?.userId || authUser?.id || '1201');
      const requestedRole = req.query.role as string | undefined;
      const roleStr = (requestedRole || authUser?.role || 'worker').toLowerCase();
      const city = (req.query.city as string) || 'Kolkata';

      const result = await activationService.getNextBestActions(userIdStr, roleStr, city);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in getNextBestActions controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve next best actions', error: err.message });
    }
  }

  /**
   * GET /api/activation/metrics
   * Returns real transactional outcomes aggregated from the database (Jobs, Apps, Bookings)
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const metrics = await activationService.getActivationMetrics(city);
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      logger.error('Error in getMetrics controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve activation metrics', error: err.message });
    }
  }

  /**
   * GET /api/activation/worker
   * Returns worker-specific activation: matching jobs, skill opportunities, profile completion
   */
  async getWorkerActivation(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = String(authUser?.userId || authUser?.id || '1201');
      const city = (req.query.city as string) || 'Kolkata';

      const result = await activationService.getWorkerActivation(userIdStr, city);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in getWorkerActivation controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve worker activation', error: err.message });
    }
  }

  /**
   * GET /api/activation/business
   * Returns business-specific activation: local skill shortages, prefilled job templates, candidate review
   */
  async getBusinessActivation(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = String(authUser?.userId || authUser?.id || '1201');
      const city = (req.query.city as string) || 'Kolkata';

      const result = await activationService.getBusinessActivation(userIdStr, city);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in getBusinessActivation controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve business activation', error: err.message });
    }
  }

  /**
   * GET /api/activation/customer
   * Returns customer-specific activation: high-demand services, booking recommendations, active appointments
   */
  async getCustomerActivation(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = String(authUser?.userId || authUser?.id || '1201');
      const city = (req.query.city as string) || 'Kolkata';

      const result = await activationService.getCustomerActivation(userIdStr, city);
      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in getCustomerActivation controller', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to retrieve customer activation', error: err.message });
    }
  }
}

export const activationController = new ActivationController();
