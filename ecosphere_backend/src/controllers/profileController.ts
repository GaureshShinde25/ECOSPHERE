import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { profileService } from '../services/profileService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const profileController = {
  getProfile: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const profile = await profileService.getProfile(req.user.userId);
      if (!profile) {
        return sendError(res, 'NOT_FOUND', 'User profile not found', 404);
      }
      return sendSuccess(res, { profile });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve profile', 500);
    }
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    // Security check: Ignore any privilege escalation attempts
    const { role, id, UserId, status, IsBlocked, IsActive, IsAdmin, verificationStatus, ...allowedData } = req.body;

    try {
      const updatedProfile = await profileService.updateProfile(req.user.userId, allowedData);
      return sendSuccess(res, {
        message: 'Profile updated successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update profile', 400);
    }
  },

  updateLocation: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const updatedProfile = await profileService.updateLocation(req.user.userId, req.body);
      return sendSuccess(res, {
        message: 'Location updated successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update location', 400);
    }
  },
};
