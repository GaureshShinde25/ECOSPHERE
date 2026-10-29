import { Router } from 'express';
import { z } from 'zod';
import { serviceController } from '../controllers/serviceController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

const createServiceSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  serviceName: z.string().min(2, 'Service name must be at least 2 characters').max(250),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  durationMinutes: z.number().int().positive().optional(),
  serviceCategoryId: z.number().int().positive().optional(),
  serviceImageUrl: z.string().max(1000).optional(),
});

const updateServiceSchema = createServiceSchema.partial();

// Public / Discovery routes
router.get('/', serviceController.getServices);
router.get('/mine', requireAuth, serviceController.getMyServices);
router.get('/categories', serviceController.getCategories);
router.get('/:id', serviceController.getServiceById);

// Protected mutation routes
router.post('/', requireAuth, requireRole('seller', 'administrator'), validateBody(createServiceSchema), serviceController.createService);
router.put('/:id', requireAuth, validateBody(updateServiceSchema), serviceController.updateService);

export default router;
