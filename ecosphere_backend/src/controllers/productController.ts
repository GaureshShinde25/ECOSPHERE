import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { productService } from '../services/productService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const productController = {
  getProducts: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const city = req.query.city ? String(req.query.city) : undefined;
      const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;

      const result = await productService.getProducts({
        page,
        limit,
        search,
        city,
        categoryId,
        businessId,
      });

      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to list products', 500);
    }
  },

  getProductById: async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Product ID is required', 400);
    }
    const id = String(rawId);

    try {
      const product = await productService.getProductById(id);
      if (!product) {
        return sendError(res, 'NOT_FOUND', `Product with ID ${id} not found`, 404);
      }
      return sendSuccess(res, { product });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve product', 500);
    }
  },

  getMyProducts: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const products = await productService.getMyProducts(req.user.userId, businessId);
      return sendSuccess(res, { products, count: products.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller products', 500);
    }
  },

  createProduct: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const isUserAdmin = req.user.role === 'administrator';
      const product = await productService.createProduct(req.user.userId, isUserAdmin, req.body);
      return sendSuccess(res, { message: 'Product created successfully', product }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_BUSINESS_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only create products for businesses you own.', 403);
      }
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create product', 400);
    }
  },

  updateProduct: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Product ID is required', 400);
    }
    const id = String(rawId);

    // Security check: Ignore protected ownership fields
    const { ProductId, BusinessId, OwnerUserId, CreatedAt, ...allowedData } = req.body;

    try {
      const isUserAdmin = req.user.role === 'administrator';
      const updatedProduct = await productService.updateProduct(id, req.user.userId, isUserAdmin, allowedData);
      return sendSuccess(res, { message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PRODUCT_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Product with ID ${id} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only update products belonging to your business.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update product', 400);
    }
  },

  deleteProduct: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Product ID is required', 400);
    }
    const id = String(rawId);

    try {
      const isUserAdmin = req.user.role === 'administrator';
      await productService.deleteProduct(id, req.user.userId, isUserAdmin);
      return sendSuccess(res, { message: 'Product deactivated successfully' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'PRODUCT_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Product with ID ${id} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only deactivate products belonging to your business.', 403);
      }
      return sendError(res, 'DELETE_FAILED', err.message || 'Failed to deactivate product', 400);
    }
  },

  getCategories: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const categories = await productService.getCategories();
      return sendSuccess(res, { categories, count: categories.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve product categories', 500);
    }
  },

  createCategory: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, 'INVALID_INPUT', 'Category name is required', 400);
    }

    try {
      const category = await productService.createCategory(name.trim(), description);
      return sendSuccess(res, { message: 'Category processed successfully', category }, 201);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create category', 400);
    }
  },
};
