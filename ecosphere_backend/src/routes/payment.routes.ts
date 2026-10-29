import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Protected Payment Routes
router.get('/mine', requireAuth, paymentController.getMyPayments);
router.get('/seller', requireAuth, requireRole('seller', 'administrator'), paymentController.getSellerPayments);
router.get('/order/:orderId', requireAuth, paymentController.getPaymentsForOrder);
router.get('/:id', requireAuth, paymentController.getPaymentById);

export default router;
