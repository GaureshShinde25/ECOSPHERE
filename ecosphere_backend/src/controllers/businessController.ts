import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { businessService } from '../services/businessService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const businessController = {
  getBusinesses: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const city = req.query.city ? String(req.query.city) : undefined;
      const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;

      const result = await businessService.getBusinesses({
        page,
        limit,
        search,
        city,
        categoryId,
      });

      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to list businesses', 500);
    }
  },

  getBusinessById: async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Business ID is required', 400);
    }
    const id = String(rawId);

    try {
      const business = await businessService.getBusinessById(id);
      if (!business) {
        return sendError(res, 'NOT_FOUND', `Business with ID ${id} not found`, 404);
      }
      return sendSuccess(res, { business });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve business', 500);
    }
  },

  getMyBusinesses: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const businesses = await businessService.getMyBusinesses(req.user.userId);
      return sendSuccess(res, { businesses, count: businesses.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller businesses', 500);
    }
  },

  createBusiness: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    // Role check: Seller or Administrator required
    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required to create business.', 403);
    }

    try {
      const business = await businessService.createBusiness(req.user.userId, req.body);
      return sendSuccess(res, { message: 'Business created successfully', business }, 201);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create business', 400);
    }
  },

  updateBusiness: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Business ID is required', 400);
    }
    const id = String(rawId);

    // Security check: Ignore protected fields
    const { ownerUserId, OwnerUserId, rating, reviewCount, VerificationStatus, CreatedAt, ...allowedData } = req.body;

    try {
      const isUserAdmin = req.user.role === 'administrator';
      const updatedBusiness = await businessService.updateBusiness(id, req.user.userId, isUserAdmin, allowedData);
      return sendSuccess(res, { message: 'Business updated successfully', business: updatedBusiness });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Business with ID ${id} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only update businesses you own.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update business', 400);
    }
  },

  getCategories: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const categories = await businessService.getCategories();
      return sendSuccess(res, { categories, count: categories.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve business categories', 500);
    }
  },
};
