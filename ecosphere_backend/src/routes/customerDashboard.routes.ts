import { Router } from 'express';
import { customerDashboardController } from '../controllers/customerDashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Strictly protected endpoint requiring JWT authentication
router.get('/dashboard', requireAuth, customerDashboardController.getDashboardData);

export default router;
