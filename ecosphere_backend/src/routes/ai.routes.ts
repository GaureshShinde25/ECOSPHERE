import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protected endpoint requiring authentication
router.post('/ai/chat', requireAuth, aiController.chat);

export default router;
