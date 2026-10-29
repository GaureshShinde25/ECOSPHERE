import { Order } from '../types';
import { mockOrders } from '../data/mockData';
import { apiClient } from './apiClient';

export interface CreateOrderItem {
  productId: string;
  quantity: number;
  /** Required when the product has size variants (clothing, apparel) */
  selectedSize?: string;
  size?: string;
}

export interface CreateOrderPayload {
  businessId: string;
  items: CreateOrderItem[];
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  customerNotes?: string;
  paymentMethod?: string;
}

export const orderService = {
  /**
   * Submit a new checkout order to backend POST /api/orders
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const response = await apiClient.post<{ success: boolean; order: Order }>('/orders', payload, {
      requiresAuth: true,
    });
    if (response && response.order) {
      return response.order;
    }
    throw new Error('Failed to place order');
  },

  /**
   * Fetch authenticated customer's orders from GET /api/orders/mine
   */
  async getMyOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<any>('/orders/mine', {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.orders || Array.isArray(payload))) {
        return payload.orders || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[orderService.getMyOrders] Failed to load customer orders', error);
      }
    }
    return [];
  },

  /**
   * Fetch authenticated seller's orders from GET /api/orders/seller
   */
  async getSellerOrders(businessId?: string): Promise<Order[]> {
    try {
      const q = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const response = await apiClient.get<any>(`/orders/seller${q}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.orders || Array.isArray(payload))) {
        return payload.orders || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[orderService.getSellerOrders] Failed to load seller orders', error);
      }
    }
    return [];
  },

  /**
   * Fetch single order details from GET /api/orders/:id
   */
  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const response = await apiClient.get<any>(`/orders/${id}`, {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.order || payload.id || payload.orderNumber)) {
        return payload.order || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[orderService.getOrderById] Error fetching order ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Update order status on backend PUT /api/orders/:id/status
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await apiClient.put<{ success: boolean; order: Order }>(`/orders/${id}/status`, { status }, {
      requiresAuth: true,
    });
    if (response && response.order) {
      return response.order;
    }
    throw new Error('Failed to update order status');
  },
};
