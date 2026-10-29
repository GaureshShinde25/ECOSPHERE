import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { paymentService } from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const paymentController = {
  getMyPayments: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const payments = await paymentService.getMyPayments(req.user.userId);
      return sendSuccess(res, { payments, count: payments.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve payment history', 500);
    }
  },

  getPaymentById: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Payment ID is required', 400);
    }

    try {
      const payment = await paymentService.getPaymentById(String(rawId), req.user.userId, req.user.role);
      if (!payment) {
        return sendError(res, 'NOT_FOUND', `Payment with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { payment });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_PAYMENT_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only access your own payment records.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve payment record', 500);
    }
  },

  getPaymentsForOrder: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawOrderId = req.params.orderId;
    if (!rawOrderId) {
      return sendError(res, 'INVALID_ID', 'Order ID is required', 400);
    }

    try {
      const payments = await paymentService.getPaymentsForOrder(String(rawOrderId), req.user.userId, req.user.role);
      return sendSuccess(res, { payments, count: payments.length });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_PAYMENT_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only access payment records for your own orders.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve order payments', 500);
    }
  },

  getSellerPayments: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required.', 403);
    }

    try {
      const payments = await paymentService.getSellerPayments(req.user.userId);
      return sendSuccess(res, { payments, count: payments.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller payments', 500);
    }
  },
};
