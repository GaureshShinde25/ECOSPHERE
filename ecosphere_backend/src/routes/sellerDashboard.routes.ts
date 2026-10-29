import { Router } from 'express';
import { sellerDashboardController } from '../controllers/sellerDashboardController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Strictly protected endpoint requiring JWT authentication & Seller or Admin role authorization
router.get('/dashboard', requireAuth, requireRole('seller', 'administrator'), sellerDashboardController.getDashboardData);

export default router;
