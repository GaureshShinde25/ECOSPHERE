import { Router } from 'express';
import { z } from 'zod';
import { businessController } from '../controllers/businessController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

export const baseBusinessSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(150).optional(),
  name: z.string().min(2, 'Business name must be at least 2 characters').max(150).optional(),
  businessType: z.string().max(100).optional(),
  type: z.string().max(100).optional(),
  description: z.string().max(4000).optional(),
  categoryId: z.number().int().positive().optional(),
  category: z.string().max(150).optional(),
  shopCategory: z.string().max(150).optional(),
  cafeCategory: z.string().max(150).optional(),
  restaurantCategory: z.string().max(150).optional(),
  hotelCategory: z.string().max(150).optional(),
  serviceCategory: z.string().max(150).optional(),
  technicalCategory: z.string().max(150).optional(),
  wholesaleCategory: z.string().max(150).optional(),
  industry: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().max(255).optional(),
  addressLine1: z.string().max(255).optional(),
  address: z.string().max(255).optional(),
  area: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  logoUrl: z.string().max(500).optional(),
  coverImageUrl: z.string().max(500).optional(),
  coverUrl: z.string().max(500).optional(),
  // Type-specific specialized fields
  cuisines: z.union([z.array(z.string()), z.string()]).optional(),
  serviceModes: z.union([z.array(z.string()), z.string()]).optional(),
  services: z.union([z.array(z.string()), z.string()]).optional(),
  amenities: z.union([z.array(z.string()), z.string()]).optional(),
  averagePrice: z.string().max(20).optional(),
  starRating: z.union([z.number(), z.string()]).optional(),
  checkInTime: z.string().max(50).optional(),
  checkOutTime: z.string().max(50).optional(),
  serviceArea: z.string().max(150).optional(),
  radius: z.string().max(100).optional(),
  pricingModel: z.string().max(100).optional(),
  workingDays: z.string().max(100).optional(),
  workingHours: z.string().max(100).optional(),
  openingHours: z.string().max(100).optional(),
  experience: z.string().max(100).optional(),
  warehouseLocation: z.string().max(200).optional(),
  minOrderQuantity: z.string().max(100).optional(),
  moq: z.string().max(100).optional(),
  bulkPricingSupported: z.boolean().optional(),
  quotationSupported: z.boolean().optional(),
  deliveryScope: z.string().max(100).optional(),
  companySize: z.string().max(100).optional(),
  attributes: z.record(z.any()).optional(),
});

export const createBusinessSchema = baseBusinessSchema
  .refine(
    (data) => Boolean((data.businessName && data.businessName.trim().length >= 2) || (data.name && data.name.trim().length >= 2)),
    {
      message: 'Business name must be at least 2 characters',
      path: ['businessName'],
    }
  )
  .superRefine((data, ctx) => {
    const rawType = (data.businessType || data.type || 'Shop').trim();
    const type = rawType.toLowerCase();

    if (type.includes('restaurant')) {
      const category = data.restaurantCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Restaurant category is required',
          path: ['restaurantCategory'],
        });
      }
      const cuisines = data.cuisines;
      const hasCuisines = Array.isArray(cuisines) ? cuisines.length > 0 : Boolean(cuisines && cuisines.trim());
      if (!hasCuisines) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one cuisine is required for restaurant',
          path: ['cuisines'],
        });
      }
    } else if (type.includes('cafe') || type.includes('café')) {
      const category = data.cafeCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Café category is required',
          path: ['cafeCategory'],
        });
      }
      const services = data.serviceModes || data.services;
      const hasServices = Array.isArray(services) ? services.length > 0 : Boolean(services && services.trim());
      if (!hasServices) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one service mode (Dine-In, Takeaway, or Delivery) is required for café',
          path: ['serviceModes'],
        });
      }
    } else if (type.includes('hotel')) {
      const category = data.hotelCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hotel category is required',
          path: ['hotelCategory'],
        });
      }
    } else if (type.includes('service provider') || type === 'service_provider') {
      const category = data.serviceCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Service category is required',
          path: ['serviceCategory'],
        });
      }
      const area = data.serviceArea || data.city || data.area;
      if (!area || !area.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Service area is required',
          path: ['serviceArea'],
        });
      }
    } else if (type.includes('technician')) {
      const category = data.technicalCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Technical category is required',
          path: ['technicalCategory'],
        });
      }
      const area = data.serviceArea || data.city || data.area;
      if (!area || !area.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Service area is required',
          path: ['serviceArea'],
        });
      }
    } else if (type.includes('wholesal') || type.includes('dealer')) {
      const category = data.wholesaleCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Wholesale category is required',
          path: ['wholesaleCategory'],
        });
      }
    } else if (type.includes('employer')) {
      const industry = data.industry || data.category;
      if (!industry || !industry.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Industry is required for employer',
          path: ['industry'],
        });
      }
    } else if (type.includes('shop')) {
      const category = data.shopCategory || data.category;
      if (!category || !category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Shop category is required',
          path: ['shopCategory'],
        });
      }
    }
  });

export const updateBusinessSchema = baseBusinessSchema.partial().extend({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(150).optional(),
  address: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

// Public / Authenticated discovery routes
router.get('/', businessController.getBusinesses);
router.get('/mine', requireAuth, businessController.getMyBusinesses);
router.get('/categories', businessController.getCategories);
router.get('/:id', businessController.getBusinessById);

// Protected mutation routes
router.post('/', requireAuth, requireRole('seller', 'administrator'), validateBody(createBusinessSchema), businessController.createBusiness);
router.put('/:id', requireAuth, validateBody(updateBusinessSchema), businessController.updateBusiness);

export default router;
