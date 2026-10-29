import { Service, Booking } from '../types';
import { mockServices, mockBookings } from '../data/mockData';
import { apiClient } from './apiClient';
import { tokenService } from './tokenService';

export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  categoryId?: number;
  businessId?: string;
}

export interface ServiceListResponse {
  success: boolean;
  services: Service[];
  total: number;
  page: number;
  totalPages: number;
}

export const serviceService = {
  /**
   * Fetch paginated real services list from backend GET /api/services
   */
  async getServices(params?: ServiceQueryParams): Promise<Service[]> {
    try {
      const queryParts: string[] = [];
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
      if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
      if (params?.businessId) queryParts.push(`businessId=${params.businessId}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get<any>(`/services${queryString}`, {
        requiresAuth: false,
      });

      const payload = response?.data || response;
      if (payload && (payload.services || Array.isArray(payload))) {
        return payload.services || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[serviceService.getServices] Error:', error);
      }
    }
    return [];
  },

  /**
   * Fetch single service details from GET /api/services/:id
   */
  async getServiceById(id: string): Promise<Service | undefined> {
    try {
      const response = await apiClient.get<any>(`/services/${id}`, {
        requiresAuth: false,
      });
      const payload = response?.data || response;
      if (payload && (payload.service || payload.id || payload.title || payload.serviceName)) {
        return payload.service || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[serviceService.getServiceById] Error fetching service ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Fetch authenticated seller's services from GET /api/services/mine
   */
  async getMyServices(businessId?: string): Promise<Service[]> {
    try {
      const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const response = await apiClient.get<any>(`/services/mine${q}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.services || Array.isArray(payload))) {
        return payload.services || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[serviceService.getMyServices] Failed to load seller services', error);
      }
    }
    return [];
  },

  /**
   * Create a new service on backend POST /api/services
   */
  async createService(data: Partial<Service>): Promise<Service> {
    const response = await apiClient.post<{ success: boolean; service: Service }>('/services', data, {
      requiresAuth: true,
    });
    if (response && response.service) {
      return response.service;
    }
    throw new Error('Failed to create service');
  },

  /**
   * Update existing service details on backend PUT /api/services/:id
   */
  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const response = await apiClient.put<{ success: boolean; service: Service }>(`/services/${id}`, data, {
      requiresAuth: true,
    });
    if (response && response.service) {
      return response.service;
    }
    throw new Error('Failed to update service');
  },

  /**
   * Submit service booking to backend POST /api/bookings
   */
  async bookService(serviceId: string, date: string, time: string, address: string): Promise<Booking> {
    try {
      const response = await apiClient.post<{ success: boolean; booking: Booking }>('/bookings', {
        serviceId,
        bookingDate: date,
        startTime: time,
        customerAddress: address,
      }, { requiresAuth: true });
      if (response && response.booking) {
        return response.booking;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[serviceService.bookService] Backend booking failed, falling back', error);
      }
    }

    const service = (await this.getServiceById(serviceId)) || mockServices.find((s) => s.id === serviceId);
    const currentUser = await tokenService.getUserSession();
    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      serviceId,
      serviceTitle: service?.title || 'Service Booking',
      providerName: service?.businessName || 'Provider',
      customerName: currentUser?.name || 'ECOSPHERE Customer',
      date,
      time,
      location: address,
      price: service?.price || 0,
      status: 'Confirmed',
    };
    mockBookings.unshift(newBooking);
    return newBooking;
  },

  async getUserBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get<{ success: boolean; bookings: Booking[] }>('/bookings/mine', { requiresAuth: true });
      if (response && response.bookings && Array.isArray(response.bookings)) {
        return response.bookings;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[serviceService.getUserBookings] Error fetching user bookings', error);
      }
    }
    return mockBookings;
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; icon: string }>> {
    try {
      const response = await apiClient.get<any>('/services/categories', { requiresAuth: false });
      const payload = response?.data || response;
      if (payload?.categories) {
        return payload.categories;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[serviceService.getCategories] Error:', error);
      }
    }
    return [];
  },
};
