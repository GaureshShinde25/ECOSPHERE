import { Router } from 'express';
import { recommendationController } from '../controllers/recommendationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protected endpoint requiring authentication
router.get('/recommendations', requireAuth, recommendationController.getRecommendations);

export default router;
