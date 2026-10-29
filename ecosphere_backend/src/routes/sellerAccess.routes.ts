import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Customer seller-access permission request workflow
router.post('/request', requireAuth, authController.requestSellerAccess);
router.get('/status', requireAuth, authController.getSellerAccessStatus);

export default router;
