import { Payment } from '../types';
import { apiClient } from './apiClient';

export const paymentService = {
  /**
   * Fetch authenticated customer's payment history from GET /api/payments/mine
   */
  async getMyPayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get<{ success: boolean; payments: Payment[] }>('/payments/mine', {
        requiresAuth: true,
      });
      if (response && response.payments && Array.isArray(response.payments)) {
        return response.payments;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[paymentService.getMyPayments] Failed to fetch customer payments', error);
      }
    }
    return [];
  },

  /**
   * Fetch specific payment details by PaymentId from GET /api/payments/:id
   */
  async getPaymentById(id: string): Promise<Payment | undefined> {
    try {
      const response = await apiClient.get<{ success: boolean; payment: Payment }>(`/payments/${id}`, {
        requiresAuth: true,
      });
      if (response && response.payment) {
        return response.payment;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[paymentService.getPaymentById] Failed to fetch payment ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Fetch payments associated with a specific OrderId from GET /api/payments/order/:orderId
   */
  async getPaymentsForOrder(orderId: string): Promise<Payment[]> {
    try {
      const response = await apiClient.get<{ success: boolean; payments: Payment[] }>(`/payments/order/${orderId}`, {
        requiresAuth: true,
      });
      if (response && response.payments && Array.isArray(response.payments)) {
        return response.payments;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[paymentService.getPaymentsForOrder] Error fetching payments for order ${orderId}`, error);
      }
    }
    return [];
  },

  /**
   * Fetch seller's business payment history from GET /api/payments/seller
   */
  async getSellerPayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get<{ success: boolean; payments: Payment[] }>('/payments/seller', {
        requiresAuth: true,
      });
      if (response && response.payments && Array.isArray(response.payments)) {
        return response.payments;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[paymentService.getSellerPayments] Failed to fetch seller payments', error);
      }
    }
    return [];
  },
};
