import { Router } from 'express';
import { economicIntelligenceController } from '../controllers/economicIntelligenceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protected endpoint requiring authentication
router.get('/economic-intelligence', requireAuth, economicIntelligenceController.getEconomicInsights);

export default router;
