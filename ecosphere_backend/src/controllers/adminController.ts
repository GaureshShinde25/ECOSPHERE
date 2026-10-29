import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { adminService } from '../services/adminService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const adminController = {
  /**
   * GET /api/admin/dashboard
   */
  getDashboardData: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const data = await adminService.getDashboardData();
      return sendSuccess(res, data);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch admin telemetry', 500);
    }
  },

  /**
   * GET /api/admin/users
   */
  getUsers: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const page = parseInt(String(req.query.page || '1'), 10) || 1;
      const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
      const search = typeof req.query.search === 'string' ? req.query.search : '';

      const data = await adminService.getUsers(page, limit, search);
      return sendSuccess(res, data);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch users', 500);
    }
  },

  /**
   * PUT /api/admin/users/:id/status
   */
  updateUserStatus: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const targetUserId = parseInt(String(req.params.id), 10);
    const { isActive } = req.body;

    if (isNaN(targetUserId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid target user ID required', 400);
    }

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'INVALID_INPUT', 'Boolean isActive field is required', 400);
    }

    try {
      const success = await adminService.updateUserStatus(adminUserId, targetUserId, isActive);
      if (!success) {
        return sendError(res, 'NOT_FOUND', 'User not found', 404);
      }
      return sendSuccess(res, { userId: String(targetUserId), isActive }, 200);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('FORBIDDEN')) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to update user status', 500);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   */
  deleteUser: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const targetUserId = parseInt(String(req.params.id), 10);

    if (isNaN(targetUserId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid target user ID required', 400);
    }

    try {
      const result = await adminService.deleteUser(adminUserId, targetUserId);
      return sendSuccess(res, result, 200);
    } catch (error: any) {
      const err = error as Error;
      if (
        (error as any).statusCode === 403 ||
        (error as any).code === 'FORBIDDEN' ||
        err.message.includes('cannot be deleted') ||
        err.message.includes('FORBIDDEN')
      ) {
        return sendError(res, 'FORBIDDEN', err.message, 403);
      }
      if ((error as any).statusCode === 404 || (error as any).code === 'NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', err.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to delete user account', 500);
    }
  },

  /**
   * PUT /api/admin/businesses/:id/verify
   */
  updateBusinessVerification: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const businessId = parseInt(String(req.params.id), 10);
    const { status } = req.body;

    if (isNaN(businessId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid business ID required', 400);
    }

    if (!status) {
      return sendError(res, 'INVALID_INPUT', 'Verification status required', 400);
    }

    try {
      const success = await adminService.updateBusinessVerification(adminUserId, businessId, status);
      if (!success) {
        return sendError(res, 'NOT_FOUND', 'Business not found', 404);
      }
      return sendSuccess(res, { businessId: String(businessId), verificationStatus: status }, 200);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('INVALID_STATUS')) {
        return sendError(res, 'INVALID_INPUT', err.message, 400);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to update business verification', 500);
    }
  },

  /**
   * GET /api/admin/audit-logs
   */
  getAuditLogs: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
      const logs = await adminService.getAuditLogs(limit);
      return sendSuccess(res, logs);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch audit logs', 500);
    }
  },

  /**
   * GET /api/admin/seller-access-requests
   */
  getSellerAccessRequests: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
      const requests = await adminService.getSellerAccessRequests(statusFilter);
      return sendSuccess(res, { requests, count: requests.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch seller requests', 500);
    }
  },

  /**
   * PUT /api/admin/seller-access-requests/:id/approve
   */
  approveSellerAccessRequest: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const requestId = parseInt(String(req.params.id), 10);

    if (isNaN(requestId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid request ID required', 400);
    }

    try {
      await adminService.approveSellerAccessRequest(adminUserId, requestId);
      return sendSuccess(res, { message: 'Seller access request approved successfully.' });
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', error.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', error.message || 'Failed to approve seller access', 500);
    }
  },

  /**
   * PUT /api/admin/seller-access-requests/:id/reject
   */
  rejectSellerAccessRequest: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const requestId = parseInt(String(req.params.id), 10);
    const { reason } = req.body || {};

    if (isNaN(requestId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid request ID required', 400);
    }

    try {
      await adminService.rejectSellerAccessRequest(adminUserId, requestId, reason);
      return sendSuccess(res, { message: 'Seller access request rejected successfully.' });
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) {
        return sendError(res, 'NOT_FOUND', error.message, 404);
      }
      return sendError(res, 'SERVER_ERROR', error.message || 'Failed to reject seller access', 500);
    }
  },

  /**
   * PUT /api/admin/seller-access-requests/:id/revoke OR /api/admin/users/:id/revoke-seller
   */
  revokeSellerAccess: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const adminUserId = parseInt(String(req.user?.userId || '0'), 10) || 0;
    const targetUserId = parseInt(String(req.params.id), 10);

    if (isNaN(targetUserId)) {
      return sendError(res, 'INVALID_INPUT', 'Valid target user ID required', 400);
    }

    try {
      await adminService.revokeSellerAccess(adminUserId, targetUserId);
      return sendSuccess(res, { message: 'Seller capability revoked successfully.' });
    } catch (error: any) {
      return sendError(res, 'SERVER_ERROR', error.message || 'Failed to revoke seller capability', 500);
    }
  },
};
