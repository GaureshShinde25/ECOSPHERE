import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { bookingService } from '../services/bookingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const bookingController = {
  createBooking: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const booking = await bookingService.createBooking(req.user.userId, req.body);
      return sendSuccess(res, { message: 'Booking confirmed successfully', booking }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message.startsWith('BOOKING_SLOT_UNAVAILABLE')) {
        return sendError(res, 'BOOKING_SLOT_UNAVAILABLE', err.message, 400);
      }
      if (err.message.startsWith('SERVICE_UNAVAILABLE') || err.message.startsWith('SERVICE_NOT_FOUND')) {
        return sendError(res, 'BAD_REQUEST', err.message, 400);
      }
      return sendError(res, 'CREATE_BOOKING_FAILED', err.message || 'Failed to create booking', 400);
    }
  },

  getMyBookings: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const bookings = await bookingService.getMyBookings(req.user.userId);
      return sendSuccess(res, { bookings, count: bookings.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve bookings', 500);
    }
  },

  getBookingById: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Booking ID is required', 400);
    }

    try {
      const booking = await bookingService.getBookingById(String(rawId), req.user.userId, req.user.role);
      if (!booking) {
        return sendError(res, 'NOT_FOUND', `Booking with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { booking });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_BOOKING_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only access your own booking records.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve booking', 500);
    }
  },

  getSellerBookings: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required.', 403);
    }

    try {
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const bookings = await bookingService.getSellerBookings(req.user.userId, businessId);
      return sendSuccess(res, { bookings, count: bookings.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve seller bookings', 500);
    }
  },

  updateBookingStatus: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Booking ID is required', 400);
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return sendError(res, 'INVALID_STATUS', 'Valid booking status is required', 400);
    }

    try {
      const updatedBooking = await bookingService.updateBookingStatus(
        String(rawId),
        req.user.userId,
        req.user.role,
        status
      );
      return sendSuccess(res, { message: 'Booking status updated successfully', booking: updatedBooking });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'BOOKING_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Booking with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_STATUS_UPDATE' || err.message === 'FORBIDDEN_BOOKING_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only update bookings for your own business.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update booking status', 400);
    }
  },

  cancelBooking: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Booking ID is required', 400);
    }

    try {
      const updatedBooking = await bookingService.updateBookingStatus(
        String(rawId),
        req.user.userId,
        req.user.role,
        'CANCELLED'
      );
      return sendSuccess(res, { message: 'Booking cancelled successfully', booking: updatedBooking });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'BOOKING_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Booking with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_STATUS_UPDATE' || err.message === 'FORBIDDEN_BOOKING_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only cancel your own bookings.', 403);
      }
      return sendError(res, 'CANCEL_FAILED', err.message || 'Failed to cancel booking', 400);
    }
  },
};
