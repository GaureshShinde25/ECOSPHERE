import { Request, Response } from 'express';
import { skillTaxonomyService } from '../services/skillTaxonomyService.js';
import { skillDemandService } from '../services/skillDemandService.js';
import { skillSupplyService } from '../services/skillSupplyService.js';
import { skillEmploymentService } from '../services/skillEmploymentService.js';
import { logger } from '../utils/logger.js';

export const skillIntelligenceController = {
  /**
   * GET /api/skills
   * Retrieves all 24 canonical skills with optional demand summary
   */
  async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const category = req.query.category as string | undefined;

      const demandRes = await skillDemandService.getSkillDemand({ city, category, limit: 50 });

      res.status(200).json({
        success: true,
        data: {
          skills: demandRes.skills,
          total: demandRes.total,
          city,
        },
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getSkills', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skills.' },
      });
    }
  },

  /**
   * GET /api/skills/demand
   * Retrieves ranked skill demand
   */
  async getDemand(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const category = req.query.category as string | undefined;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const limit = isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(50, rawLimit);

      const result = await skillDemandService.getSkillDemand({ city, category, limit });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getDemand', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skill demand.' },
      });
    }
  },

  /**
   * GET /api/skills/gaps
   * Retrieves skill supply shortages and surplus talent pools
   */
  async getGaps(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const category = req.query.category as string | undefined;
      const status = req.query.status as 'DEFICIT' | 'BALANCED' | 'SURPLUS' | undefined;
      const rawRatio = req.query.minRatio ? parseFloat(req.query.minRatio as string) : undefined;
      const minRatio = isNaN(rawRatio as any) ? undefined : rawRatio;
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const limit = isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(50, rawLimit);

      const result = await skillSupplyService.getSkillSupplyGaps({
        city,
        category,
        status,
        minRatio,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getGaps', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skill gaps.' },
      });
    }
  },

  /**
   * GET /api/skills/trends
   * Retrieves short-term trailing 14-day WoW skill growth trends
   */
  async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';

      const result = await skillEmploymentService.getSkillTrends(city);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getTrends', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skill trends.' },
      });
    }
  },

  /**
   * GET /api/skills/employment
   * Retrieves employment opportunities grouped by skills
   */
  async getEmployment(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || 'Kolkata';
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const limit = isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(50, rawLimit);

      const result = await skillEmploymentService.getEmploymentOpportunities({ city, limit });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getEmployment', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve employment opportunities.' },
      });
    }
  },

  /**
   * GET /api/skills/recommendations
   * Retrieves authenticated user role-specific skill intelligence
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const requestedRole = req.query.role as string | undefined;
      const roleStr = (requestedRole || authUser?.role || 'worker').toLowerCase();
      const validRole = roleStr === 'customer' ? 'customer' : roleStr === 'seller' ? 'seller' : 'worker';
      const city = (req.query.city as string) || 'Kolkata';

      const result = await skillEmploymentService.getRoleSpecificSkills(validRole, city);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getRecommendations', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skill recommendations.' },
      });
    }
  },

  /**
   * GET /api/skills/:id
   * Retrieves single skill detail breakdown with evidence chips
   */
  async getSkillById(req: Request, res: Response): Promise<void> {
    try {
      const rawId = parseInt(req.params.id as string, 10);
      if (isNaN(rawId) || rawId < 1 || rawId > 24) {
        res.status(404).json({
          success: false,
          error: { code: 'SKILL_NOT_FOUND', message: 'Invalid or unknown canonical skill ID (must be 1-24).' },
        });
        return;
      }

      const city = (req.query.city as string) || 'Kolkata';
      const result = await skillEmploymentService.getSkillDetailById(rawId, city);

      if (!result) {
        res.status(404).json({
          success: false,
          error: { code: 'SKILL_NOT_FOUND', message: `Skill ID ${rawId} not found in canonical taxonomy.` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error in skillIntelligenceController.getSkillById', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve skill details.' },
      });
    }
  },
};
