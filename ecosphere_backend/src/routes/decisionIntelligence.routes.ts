import { Router } from 'express';
import { decisionIntelligenceController } from '../controllers/decisionIntelligenceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/decision-intelligence/opportunities', requireAuth, decisionIntelligenceController.getOpportunities);
router.get('/decision-intelligence/compare', requireAuth, decisionIntelligenceController.compare);
router.get('/decision-intelligence/employment', requireAuth, decisionIntelligenceController.getEmployment);

export default router;
