import { Router } from 'express';
import { z } from 'zod';
import { productController } from '../controllers/productController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  stockQuantity: z.number().int().min(0, 'Stock must be non-negative'),
  price: z.number().min(0).optional(),
  sku: z.string().optional(),
});

const baseProductSchema = z.object({
  businessId: z.union([z.string(), z.number()]).transform((v) => String(v)),
  productName: z.string().min(2, 'Product name must be at least 2 characters').max(250).optional(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(250).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  discountPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  productCategoryId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  productImageUrl: z.string().max(1000).optional(),
  imageUrl: z.string().max(1000).optional(),
  brandName: z.string().max(150).optional(),
  unitName: z.string().max(50).optional(),
  sku: z.string().max(100).optional(),
  isAvailable: z.boolean().optional(),
  inStock: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

const createProductSchema = baseProductSchema.refine((data) => Boolean(data.productName || data.title), {
  message: 'Product name or title is required',
  path: ['productName'],
});

const updateProductSchema = baseProductSchema.partial();

// Public / Discovery routes
router.get('/', productController.getProducts);
router.get('/mine', requireAuth, productController.getMyProducts);
router.get('/categories', productController.getCategories);
router.post('/categories', requireAuth, productController.createCategory);
router.get('/:id', productController.getProductById);

// Protected mutation routes
router.post('/', requireAuth, requireRole('seller', 'administrator'), validateBody(createProductSchema), productController.createProduct);
router.put('/:id', requireAuth, validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', requireAuth, requireRole('seller', 'administrator'), productController.deleteProduct);

export default router;
