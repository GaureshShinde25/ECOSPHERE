import { Router } from 'express';
import { opportunityController } from '../controllers/opportunityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protected endpoint requiring authentication
router.get('/opportunities', requireAuth, opportunityController.getOpportunities);

export default router;
