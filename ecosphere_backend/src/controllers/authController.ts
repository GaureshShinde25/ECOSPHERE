import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { authService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authController = {
  requestOtp: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { mobile, intent } = req.body;
    if (!mobile || typeof mobile !== 'string') {
      return sendError(res, 'INVALID_MOBILE', 'Mobile number is required', 400);
    }

    try {
      const result = await authService.requestOtp(mobile, intent);
      return sendSuccess(res, result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      const code = error.code || 'OTP_REQUEST_FAILED';
      return sendError(res, code, error.message || 'Failed to request OTP', statusCode);
    }
  },

  verifyOtp: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { mobile, otp, name, firstName, lastName, email, requestedRole, sellerType, password, intent, registrationData } = req.body;
    if (!mobile || !otp) {
      return sendError(res, 'INVALID_INPUT', 'Mobile number and OTP are required', 400);
    }

    try {
      const regPayload = {
        name: name || registrationData?.name,
        firstName: firstName || registrationData?.firstName,
        lastName: lastName || registrationData?.lastName,
        email: email || registrationData?.email,
        requestedRole: requestedRole || registrationData?.requestedRole || registrationData?.role,
        sellerType: sellerType || registrationData?.sellerType,
        password: password || registrationData?.password,
      };

      const authResult = await authService.verifyOtp(
        mobile,
        otp,
        regPayload,
        intent
      );
      return sendSuccess(res, authResult);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      const code = error.code || 'AUTH_FAILED';
      return sendError(res, code, error.message || 'OTP verification failed', statusCode);
    }
  },

  login: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { identifier, username, mobile, password } = req.body;
    const loginId = identifier || username || mobile;

    if (!loginId) {
      return sendError(res, 'INVALID_INPUT', 'Username, email, or mobile number is required', 400);
    }

    try {
      const authResult = await authService.login(loginId, password);
      return sendSuccess(res, authResult);
    } catch (error: any) {
      const statusCode = error.statusCode || 401;
      const code = error.code || 'LOGIN_FAILED';
      return sendError(res, code, error.message || 'Login failed', statusCode);
    }
  },

  getMe: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
    }

    try {
      const user = await authService.getCurrentUser(req.user.userId);
      if (!user) {
        return sendError(res, 'USER_NOT_FOUND', 'User session could not be resolved from token', 404);
      }

      return sendSuccess(res, { user });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve profile', 500);
    }
  },

  switchMode: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
    }

    const { targetMode, sellerType } = req.body;
    try {
      const switchResult = await authService.switchMode(req.user.userId, targetMode, sellerType);
      return sendSuccess(res, switchResult);
    } catch (error: any) {
      if (error.code === 'SELLER_ACCESS_UNAPPROVED') {
        return sendError(res, 'SELLER_ACCESS_UNAPPROVED', error.message, 403);
      }
      if (error.code === 'SELLER_SETUP_REQUIRED') {
        return sendError(res, 'SELLER_SETUP_REQUIRED', error.message, 400);
      }
      return sendError(res, 'SWITCH_FAILED', error.message || 'Failed to switch role mode', 500);
    }
  },

  requestSellerAccess: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
    }

    const { notes } = req.body;
    try {
      const result = await authService.requestSellerAccess(req.user.userId, notes);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, 'REQUEST_FAILED', error.message || 'Failed to submit seller request', 400);
    }
  },

  getSellerAccessStatus: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
    }

    try {
      const result = await authService.getSellerAccessStatus(req.user.userId);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, 'STATUS_FAILED', error.message || 'Failed to get seller status', 500);
    }
  },

  requestPasswordReset: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { identifier, mobile, email } = req.body;
    const input = identifier || mobile || email;
    if (!input || typeof input !== 'string') {
      return sendError(res, 'INVALID_INPUT', 'Registered mobile number, email, or username is required', 400);
    }

    try {
      const result = await authService.requestPasswordReset(input);
      return sendSuccess(res, result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      const code = error.code || 'RESET_REQUEST_FAILED';
      return sendError(res, code, error.message || 'Failed to request password reset OTP', statusCode);
    }
  },

  verifyPasswordResetOtp: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { identifier, mobile, email, otp } = req.body;
    const input = identifier || mobile || email;
    if (!input || !otp) {
      return sendError(res, 'INVALID_INPUT', 'Identifier and OTP are required', 400);
    }

    try {
      const result = await authService.verifyPasswordResetOtp(input, otp);
      return sendSuccess(res, result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      const code = error.code || 'OTP_VERIFICATION_FAILED';
      return sendError(res, code, error.message || 'Failed to verify OTP', statusCode);
    }
  },

  resetPassword: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword) {
      return sendError(res, 'INVALID_INPUT', 'Reset token, new password, and confirm password are required', 400);
    }

    try {
      const result = await authService.resetPassword(resetToken, newPassword, confirmPassword);
      return sendSuccess(res, result);
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      const code = error.code || 'PASSWORD_RESET_FAILED';
      return sendError(res, code, error.message || 'Failed to reset password', statusCode);
    }
  },
};
