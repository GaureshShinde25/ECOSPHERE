import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { serviceService } from '../services/serviceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const serviceController = {
  getServices: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const city = req.query.city ? String(req.query.city) : undefined;
      const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;

      const result = await serviceService.getServices({
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
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to list services', 500);
    }
  },

  getServiceById: async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Service ID is required', 400);
    }
    const id = String(rawId);

    try {
      const service = await serviceService.getServiceById(id);
      if (!service) {
        return sendError(res, 'NOT_FOUND', `Service with ID ${id} not found`, 404);
      }
      return sendSuccess(res, { service });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve service', 500);
    }
  },

  getMyServices: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const services = await serviceService.getMyServices(req.user.userId, businessId);
      return sendSuccess(res, { services, count: services.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller services', 500);
    }
  },

  createService: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    // Role check: Seller or Administrator required
    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required to create service.', 403);
    }

    try {
      const isUserAdmin = req.user.role === 'administrator';
      const service = await serviceService.createService(req.user.userId, isUserAdmin, req.body);
      return sendSuccess(res, { message: 'Service created successfully', service }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_BUSINESS_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only create services for businesses you own.', 403);
      }
      return sendError(res, 'CREATE_FAILED', err.message || 'Failed to create service', 400);
    }
  },

  updateService: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Service ID is required', 400);
    }
    const id = String(rawId);

    // Security check: Ignore protected ownership fields
    const { ServiceId, BusinessId, ServiceProviderId, CreatedAt, ...allowedData } = req.body;

    try {
      const isUserAdmin = req.user.role === 'administrator';
      const updatedService = await serviceService.updateService(id, req.user.userId, isUserAdmin, allowedData);
      return sendSuccess(res, { message: 'Service updated successfully', service: updatedService });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'SERVICE_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Service with ID ${id} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_OWNERSHIP') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only update services belonging to your business.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update service', 400);
    }
  },

  getCategories: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const categories = await serviceService.getCategories();
      return sendSuccess(res, { categories, count: categories.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve service categories', 500);
    }
  },
};
