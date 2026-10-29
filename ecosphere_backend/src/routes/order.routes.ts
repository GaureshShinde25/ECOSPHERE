import { Router } from 'express';
import { z } from 'zod';
import { orderController } from '../controllers/orderController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  size: z.string().optional(),
  selectedSize: z.string().optional(),
});

const createOrderSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  items: z.array(orderItemSchema).min(1, 'At least one product item is required'),
  shippingAddress: z.string().max(500).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingState: z.string().max(100).optional(),
  shippingPostalCode: z.string().max(20).optional(),
  customerNotes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(50).optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

// Protected routes (Customer / Seller / Admin)
router.post('/', requireAuth, validateBody(createOrderSchema), orderController.createOrder);
router.get('/mine', requireAuth, orderController.getMyOrders);
router.get('/seller', requireAuth, requireRole('seller', 'administrator'), orderController.getSellerOrders);
router.get('/:id', requireAuth, orderController.getOrderById);
router.put('/:id/status', requireAuth, requireRole('seller', 'administrator'), validateBody(updateStatusSchema), orderController.updateOrderStatus);

export default router;
