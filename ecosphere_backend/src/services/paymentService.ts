import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface PaymentDetail {
  id: string;
  userId: string;
  orderId?: string;
  bookingId?: string;
  paymentReference: string;
  gatewayName?: string;
  gatewayTransactionId?: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  gatewayResponse?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  orderNumber?: string;
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    return directId;
  }

  const cleanMobile = userIdStr.replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  if (searchMobile) {
    const userByMobile = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WHERE Mobile = @mobile',
      [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

function mapDbRowToPayment(row: any): PaymentDetail {
  return {
    id: String(row.PaymentId),
    userId: String(row.UserId),
    orderId: row.OrderId ? String(row.OrderId) : undefined,
    bookingId: row.BookingId ? String(row.BookingId) : undefined,
    paymentReference: row.PaymentReference || `PAY-${row.PaymentId}`,
    gatewayName: row.GatewayName || undefined,
    gatewayTransactionId: row.GatewayTransactionId || undefined,
    paymentMethod: row.PaymentMethod || 'UPI',
    amount: row.Amount ? Number(row.Amount) : 0,
    currency: row.Currency || 'INR',
    status: row.Status || 'COMPLETED',
    gatewayResponse: row.GatewayResponse || undefined,
    paidAt: row.PaidAt ? new Date(row.PaidAt).toISOString() : undefined,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
    orderNumber: row.OrderNumber || undefined,
  };
}

export const paymentService = {
  /**
   * Fetch authenticated customer's payment history
   */
  async getMyPayments(requestingUserId: string): Promise<PaymentDetail[]> {
    const customerUserId = await resolveDbUserId(requestingUserId);
    if (!customerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const paymentsRes = await databaseService.query<any>(
        `SELECT 
           p.PaymentId, p.UserId, p.OrderId, p.BookingId, p.PaymentReference,
           p.GatewayName, p.GatewayTransactionId, p.PaymentMethod, p.Amount,
           p.Currency, p.Status, p.GatewayResponse, p.PaidAt, p.CreatedAt, p.UpdatedAt,
           o.OrderNumber
         FROM Payments p
         LEFT JOIN Orders o ON p.OrderId = o.OrderId
         WHERE p.UserId = @custUserId
         ORDER BY p.PaymentId DESC`,
        [{ name: 'custUserId', type: mssql.BigInt(), value: customerUserId }]
      );

      return (paymentsRes.recordset || []).map(mapDbRowToPayment);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query customer payments', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch specific payment detail by PaymentId with strict ownership authorization
   */
  async getPaymentById(
    paymentIdStr: string,
    requestingUserId: string,
    requestingRole: string
  ): Promise<PaymentDetail | null> {
    const numericPaymentId = parseInt(paymentIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPaymentId)) return null;

    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      const payRes = await databaseService.query<any>(
        `SELECT 
           p.PaymentId, p.UserId, p.OrderId, p.BookingId, p.PaymentReference,
           p.GatewayName, p.GatewayTransactionId, p.PaymentMethod, p.Amount,
           p.Currency, p.Status, p.GatewayResponse, p.PaidAt, p.CreatedAt, p.UpdatedAt,
           o.OrderNumber, o.CustomerUserId AS OrderCustomerUserId, o.BusinessId,
           b.OwnerUserId AS BusinessOwnerUserId
         FROM Payments p
         LEFT JOIN Orders o ON p.OrderId = o.OrderId
         LEFT JOIN Businesses b ON o.BusinessId = b.BusinessId
         WHERE p.PaymentId = @payId`,
        [{ name: 'payId', type: mssql.BigInt(), value: numericPaymentId }]
      );

      if (!payRes.recordset || payRes.recordset.length === 0) {
        return null;
      }

      const row = payRes.recordset[0];

      // Authorization checks
      const isPayer = Number(row.UserId) === dbUserId;
      const isOrderCustomer = row.OrderCustomerUserId && Number(row.OrderCustomerUserId) === dbUserId;
      const isBusinessOwner = row.BusinessOwnerUserId && Number(row.BusinessOwnerUserId) === dbUserId;
      const isAdmin = requestingRole === 'administrator';

      if (!isPayer && !isOrderCustomer && !isBusinessOwner && !isAdmin) {
        throw new Error('FORBIDDEN_PAYMENT_ACCESS');
      }

      return mapDbRowToPayment(row);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_PAYMENT_ACCESS') {
        throw err;
      }
      logger.error('Failed to query payment by ID', { paymentIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch payments associated with a specific OrderId
   */
  async getPaymentsForOrder(
    orderIdStr: string,
    requestingUserId: string,
    requestingRole: string
  ): Promise<PaymentDetail[]> {
    const numericOrderId = parseInt(orderIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericOrderId)) return [];

    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      // First verify ownership of the order
      const orderRes = await databaseService.query<any>(
        `SELECT o.CustomerUserId, b.OwnerUserId
         FROM Orders o
         INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         WHERE o.OrderId = @ordId`,
        [{ name: 'ordId', type: mssql.BigInt(), value: numericOrderId }]
      );

      if (!orderRes.recordset || orderRes.recordset.length === 0) {
        return [];
      }

      const ordRow = orderRes.recordset[0];
      const isCustomerOwner = Number(ordRow.CustomerUserId) === dbUserId;
      const isBusinessOwner = Number(ordRow.OwnerUserId) === dbUserId;
      const isAdmin = requestingRole === 'administrator';

      if (!isCustomerOwner && !isBusinessOwner && !isAdmin) {
        throw new Error('FORBIDDEN_PAYMENT_ACCESS');
      }

      const payRes = await databaseService.query<any>(
        `SELECT 
           p.PaymentId, p.UserId, p.OrderId, p.BookingId, p.PaymentReference,
           p.GatewayName, p.GatewayTransactionId, p.PaymentMethod, p.Amount,
           p.Currency, p.Status, p.GatewayResponse, p.PaidAt, p.CreatedAt, p.UpdatedAt,
           o.OrderNumber
         FROM Payments p
         INNER JOIN Orders o ON p.OrderId = o.OrderId
         WHERE p.OrderId = @ordId
         ORDER BY p.PaymentId DESC`,
        [{ name: 'ordId', type: mssql.BigInt(), value: numericOrderId }]
      );

      return (payRes.recordset || []).map(mapDbRowToPayment);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_PAYMENT_ACCESS') {
        throw err;
      }
      logger.error('Failed to query payments for order', { orderIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch payments related to orders for seller's businesses
   */
  async getSellerPayments(requestingUserId: string): Promise<PaymentDetail[]> {
    const sellerUserId = await resolveDbUserId(requestingUserId);
    if (!sellerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const paymentsRes = await databaseService.query<any>(
        `SELECT 
           p.PaymentId, p.UserId, p.OrderId, p.BookingId, p.PaymentReference,
           p.GatewayName, p.GatewayTransactionId, p.PaymentMethod, p.Amount,
           p.Currency, p.Status, p.GatewayResponse, p.PaidAt, p.CreatedAt, p.UpdatedAt,
           o.OrderNumber
         FROM Payments p
         INNER JOIN Orders o ON p.OrderId = o.OrderId
         INNER JOIN Businesses b ON o.BusinessId = b.BusinessId
         WHERE b.OwnerUserId = @sellerId
         ORDER BY p.PaymentId DESC`,
        [{ name: 'sellerId', type: mssql.BigInt(), value: sellerUserId }]
      );

      return (paymentsRes.recordset || []).map(mapDbRowToPayment);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller payments', { requestingUserId, error: err.message });
      throw err;
    }
  },
};
