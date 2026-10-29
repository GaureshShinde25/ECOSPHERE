import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { orderService } from '../services/orderService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const orderController = {
  createOrder: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const order = await orderService.createOrder(req.user.userId, req.body);
      return sendSuccess(res, { message: 'Order placed successfully', order }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.startsWith('INSUFFICIENT_STOCK')) {
        return sendError(res, 'INSUFFICIENT_STOCK', err.message, 400);
      }
      if (err.message.startsWith('PRODUCT_BUSINESS_MISMATCH')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'CREATE_ORDER_FAILED', err.message || 'Failed to place order', 400);
    }
  },

  getMyOrders: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const orders = await orderService.getMyOrders(req.user.userId);
      return sendSuccess(res, { orders, count: orders.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve orders', 500);
    }
  },

  getOrderById: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Order ID is required', 400);
    }

    try {
      const order = await orderService.getOrderById(String(rawId), req.user.userId, req.user.role);
      if (!order) {
        return sendError(res, 'NOT_FOUND', `Order with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { order });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_ORDER_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only access your own orders.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve order', 500);
    }
  },

  getSellerOrders: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required.', 403);
    }

    try {
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const orders = await orderService.getSellerOrders(req.user.userId, businessId);
      return sendSuccess(res, { orders, count: orders.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller orders', 500);
    }
  },

  updateOrderStatus: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Order ID is required', 400);
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return sendError(res, 'INVALID_STATUS', 'Valid order status is required', 400);
    }

    try {
      const updatedOrder = await orderService.updateOrderStatus(
        String(rawId),
        req.user.userId,
        req.user.role,
        status
      );
      return sendSuccess(res, { message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'ORDER_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Order with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_STATUS_UPDATE' || err.message === 'FORBIDDEN_ORDER_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only update orders for your own business.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update order status', 400);
    }
  },
};
