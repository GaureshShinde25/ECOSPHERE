import { Router } from 'express';
import { trendIntelligenceController } from '../controllers/trendIntelligenceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/trends/categories', requireAuth, trendIntelligenceController.getCategories);
router.get('/trends/emerging', requireAuth, trendIntelligenceController.getEmerging);
router.get('/trends/declining', requireAuth, trendIntelligenceController.getDeclining);
router.get('/trends/patterns', requireAuth, trendIntelligenceController.getPatterns);
router.get('/trends/opportunities', requireAuth, trendIntelligenceController.getOpportunities);

export default router;
