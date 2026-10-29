import { Booking } from '../types';
import { mockBookings } from '../data/mockData';
import { apiClient } from './apiClient';

export interface CreateBookingPayload {
  serviceId: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  customerNotes?: string;
  paymentMethod?: string;
}

export const bookingService = {
  /**
   * Submit a new service booking to POST /api/bookings
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const response = await apiClient.post<any>('/bookings', payload, {
      requiresAuth: true,
    });
    const resData = response?.data || response;
    if (resData && (resData.booking || resData.id || resData.bookingNumber)) {
      return resData.booking || resData;
    }
    throw new Error('Failed to confirm service booking');
  },

  /**
   * Fetch authenticated customer's bookings from GET /api/bookings/mine
   */
  async getMyBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get<any>('/bookings/mine', {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.bookings || Array.isArray(payload))) {
        return payload.bookings || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[bookingService.getMyBookings] Failed to fetch customer bookings', error);
      }
    }
    return [];
  },

  /**
   * Fetch authenticated seller's business bookings from GET /api/bookings/seller
   */
  async getSellerBookings(businessId?: string): Promise<Booking[]> {
    try {
      const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const response = await apiClient.get<any>(`/bookings/seller${q}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.bookings || Array.isArray(payload))) {
        return payload.bookings || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[bookingService.getSellerBookings] Failed to fetch seller bookings', error);
      }
    }
    return [];
  },

  /**
   * Fetch specific booking details by ID from GET /api/bookings/:id
   */
  async getBookingById(id: string): Promise<Booking | undefined> {
    try {
      const response = await apiClient.get<any>(`/bookings/${id}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.booking || payload.id || payload.bookingNumber)) {
        return payload.booking || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[bookingService.getBookingById] Error fetching booking ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Update booking status on backend PUT /api/bookings/:id/status
   */
  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const response = await apiClient.put<{ success: boolean; booking: Booking }>(`/bookings/${id}/status`, { status }, {
      requiresAuth: true,
    });
    if (response && response.booking) {
      return response.booking;
    }
    throw new Error('Failed to update booking status');
  },

  /**
   * Cancel booking on backend PUT /api/bookings/:id/cancel
   */
  async cancelBooking(id: string): Promise<Booking> {
    const response = await apiClient.put<{ success: boolean; booking: Booking }>(`/bookings/${id}/cancel`, {}, {
      requiresAuth: true,
    });
    if (response && response.booking) {
      return response.booking;
    }
    throw new Error('Failed to cancel booking');
  },
};
