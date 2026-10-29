import { Router } from 'express';
import { skillIntelligenceController } from '../controllers/skillIntelligenceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/skills', requireAuth, skillIntelligenceController.getSkills);
router.get('/skills/demand', requireAuth, skillIntelligenceController.getDemand);
router.get('/skills/gaps', requireAuth, skillIntelligenceController.getGaps);
router.get('/skills/trends', requireAuth, skillIntelligenceController.getTrends);
router.get('/skills/employment', requireAuth, skillIntelligenceController.getEmployment);
router.get('/skills/recommendations', requireAuth, skillIntelligenceController.getRecommendations);
router.get('/skills/:id', requireAuth, skillIntelligenceController.getSkillById);

export default router;
