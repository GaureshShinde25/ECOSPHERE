import { Router } from 'express';
import { z } from 'zod';
import { profileController } from '../controllers/profileController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().max(50, 'First name must be under 50 characters').optional(),
  lastName: z.string().max(50, 'Last name must be under 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  occupation: z.string().max(100, 'Occupation must be under 100 characters').optional(),
  sellerType: z.string().max(100).optional(),
  shopType: z.string().max(100).optional(),
  categories: z.array(z.string()).optional(),
  education: z.string().max(100, 'Education must be under 100 characters').optional(),
  website: z.string().max(255, 'Website URL must be under 255 characters').optional(),
  profileImageUrl: z.string().max(500, 'Image URL must be under 500 characters').optional(),
  preferences: z.record(z.any()).optional(),
  city: z.string().max(150).optional(),
  state: z.string().max(150).optional(),
  country: z.string().max(100).optional(),
  area: z.string().max(150).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z.string().max(30).optional(),
});

const updateLocationSchema = z.object({
  city: z.string().min(1, 'City is required').max(150),
  state: z.string().max(150).optional(),
  country: z.string().max(100).optional(),
  area: z.string().max(150).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z.string().max(30).optional(),
});

router.get('/', requireAuth, profileController.getProfile);
router.put('/', requireAuth, validateBody(updateProfileSchema), profileController.updateProfile);
router.put('/location', requireAuth, validateBody(updateLocationSchema), profileController.updateLocation);

export default router;
