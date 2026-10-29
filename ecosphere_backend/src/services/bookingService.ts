import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface CreateBookingInput {
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

export interface BookingDetail {
  id: string;
  bookingNumber: string;
  serviceId: string;
  serviceTitle: string;
  businessId: string;
  businessName: string;
  providerName: string;
  customerUserId: string;
  customerName: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  location: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  customerNotes?: string;
  providerNotes?: string;
  price: number;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
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
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE Mobile = @exactMobile OR Mobile = @mobile',
      [
        { name: 'exactMobile', type: mssql.NVarChar(50), value: userIdStr },
        { name: 'mobile', type: mssql.NVarChar(50), value: searchMobile },
      ]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

function mapDbRowToBooking(row: any): BookingDetail {
  const custName = `${row.CustomerFirstName || row.FirstName || ''} ${row.CustomerLastName || row.LastName || ''}`.trim() || 'Valued Customer';
  const amt = row.Amount ? Number(row.Amount) : (row.ServicePrice ? Number(row.ServicePrice) : 0);
  const statusStr = row.Status || 'PENDING';
  const rawDate = row.BookingDate ? new Date(row.BookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const timeStr = row.StartTime ? String(row.StartTime).substring(0, 5) : '10:00 AM';

  const fullLocation = [row.CustomerAddress, row.CustomerCity, row.CustomerState]
    .filter(Boolean)
    .join(', ') || 'Customer Premises';

  return {
    id: String(row.BookingId),
    bookingNumber: row.BookingNumber || `BK-${row.BookingId}`,
    serviceId: String(row.ServiceId),
    serviceTitle: row.ServiceTitle || 'Professional Service',
    businessId: String(row.BusinessId),
    businessName: row.BusinessName || 'ECOSPHERE Service Provider',
    providerName: row.BusinessName ? `${row.BusinessName} Specialist` : 'Service Provider',
    customerUserId: String(row.CustomerUserId),
    customerName: custName,
    date: rawDate,
    time: timeStr,
    startTime: row.StartTime ? String(row.StartTime) : undefined,
    endTime: row.EndTime ? String(row.EndTime) : undefined,
    location: fullLocation,
    customerAddress: row.CustomerAddress || undefined,
    customerCity: row.CustomerCity || undefined,
    customerState: row.CustomerState || undefined,
    customerPostalCode: row.CustomerPostalCode || undefined,
    customerNotes: row.CustomerNotes || undefined,
    providerNotes: row.ProviderNotes || undefined,
    price: amt,
    amount: amt,
    status: statusStr,
    paymentStatus: row.PaymentStatus || 'PAID',
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
  };
}

export const bookingService = {
  /**
   * Create a new booking with service price verification, double booking protection, and payment record creation
   */
  async createBooking(requestingUserId: string, input: CreateBookingInput): Promise<BookingDetail> {
    const customerUserId = await resolveDbUserId(requestingUserId);
    if (!customerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const numServiceId = parseInt(String(input.serviceId).replace(/\D/g, ''), 10);
    if (isNaN(numServiceId) || numServiceId <= 0) {
      throw new Error('INVALID_SERVICE_ID');
    }

    // 1. Verify Service in SQL Server & fetch authoritative price and business ID
    const serviceRes = await databaseService.query<any>(
      `SELECT s.ServiceId, s.BusinessId, s.ServiceName, s.Price, s.IsAvailable, s.IsActive, b.OwnerUserId, b.BusinessName
       FROM Services s
       INNER JOIN Businesses b ON s.BusinessId = b.BusinessId
       WHERE s.ServiceId = @sId`,
      [{ name: 'sId', type: mssql.BigInt(), value: numServiceId }]
    );

    if (!serviceRes.recordset || serviceRes.recordset.length === 0) {
      throw new Error(`SERVICE_NOT_FOUND: ${numServiceId}`);
    }

    const srv = serviceRes.recordset[0];
    if (!srv.IsActive || !srv.IsAvailable) {
      throw new Error(`SERVICE_UNAVAILABLE: ${srv.ServiceName}`);
    }

    const numericBizId = Number(srv.BusinessId);
    const dbPrice = Number(srv.Price);
    const bookingDateStr = input.bookingDate || new Date().toISOString().split('T')[0];

    // 2. Server-side Double-Booking Slot Conflict Check
    const conflictRes = await databaseService.query<any>(
      `SELECT TOP 1 BookingId FROM Bookings 
       WHERE ServiceId = @sId 
         AND BookingDate = @bDate 
         AND Status IN ('PENDING', 'CONFIRMED')
         AND (@sTime IS NULL OR StartTime = @sTime)`,
      [
        { name: 'sId', type: mssql.BigInt(), value: numServiceId },
        { name: 'bDate', type: mssql.Date(), value: bookingDateStr },
        { name: 'sTime', type: mssql.Time(), value: input.startTime || null },
      ]
    );

    if (conflictRes.recordset && conflictRes.recordset.length > 0) {
      throw new Error(`BOOKING_SLOT_UNAVAILABLE: Service "${srv.ServiceName}" is already booked on ${bookingDateStr}${input.startTime ? ` at ${input.startTime}` : ''}`);
    }

    const bookingNumber = `BK-ECO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const paymentReference = `PAY-ECO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    let createdBookingId = 0;

    try {
      // A. Insert Booking
      const bookingInsertRes = await databaseService.query<any>(
        `INSERT INTO Bookings (
           BookingNumber, ServiceId, CustomerUserId, BusinessId, BookingDate,
           StartTime, EndTime, CustomerAddress, CustomerCity, CustomerState,
           CustomerPostalCode, Amount, CustomerNotes, Status, PaymentStatus, CreatedAt
         )
         OUTPUT INSERTED.BookingId
         VALUES (
           @bkNum, @sId, @custUserId, @bizId, @bkDate,
           @sTime, @eTime, @cAddr, @cCity, @cState,
           @cZip, @amt, @cNotes, 'CONFIRMED', 'PAID', CURRENT_TIMESTAMP
         )`,
        [
          { name: 'bkNum', type: mssql.VarChar(40), value: bookingNumber },
          { name: 'sId', type: mssql.BigInt(), value: numServiceId },
          { name: 'custUserId', type: mssql.BigInt(), value: customerUserId },
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'bkDate', type: mssql.Date(), value: bookingDateStr },
          { name: 'sTime', type: mssql.Time(), value: input.startTime || null },
          { name: 'eTime', type: mssql.Time(), value: input.endTime || null },
          { name: 'cAddr', type: mssql.NVarChar(1000), value: input.customerAddress || 'Hinjewadi Phase 1' },
          { name: 'cCity', type: mssql.NVarChar(150), value: input.customerCity || 'Pune' },
          { name: 'cState', type: mssql.NVarChar(150), value: input.customerState || 'Maharashtra' },
          { name: 'cZip', type: mssql.NVarChar(20), value: input.customerPostalCode || '411057' },
          { name: 'amt', type: mssql.Decimal(18, 2), value: dbPrice },
          { name: 'cNotes', type: mssql.NVarChar(2000), value: input.customerNotes || '' },
        ]
      );

      createdBookingId = Number(bookingInsertRes.recordset[0].BookingId);

      // B. Create Payment Record for Booking
      await databaseService.query(
        `INSERT INTO Payments (
           UserId, BookingId, PaymentReference, GatewayName, GatewayTransactionId,
           PaymentMethod, Amount, Currency, Status, PaidAt, CreatedAt
         )
         VALUES (
           @uId, @bkId, @payRef, 'ECOSPHERE_TEST_GATEWAY', @payRef,
           @payMethod, @amt, 'INR', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'uId', type: mssql.BigInt(), value: customerUserId },
          { name: 'bkId', type: mssql.BigInt(), value: createdBookingId },
          { name: 'payRef', type: mssql.VarChar(100), value: paymentReference },
          { name: 'payMethod', type: mssql.VarChar(50), value: input.paymentMethod || 'UPI' },
          { name: 'amt', type: mssql.Decimal(18, 2), value: dbPrice },
        ]
      );

      const created = await this.getBookingById(String(createdBookingId), requestingUserId, 'customer');
      if (!created) {
        throw new Error('Booking created successfully but failed to reload record');
      }

      // Generate notification for customer
      notificationService.createNotification({
        userId: customerUserId,
        notificationType: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your service booking #${created.bookingNumber} for ${created.serviceTitle} has been confirmed.`,
        referenceType: 'Booking',
        referenceId: created.id,
      }).catch((e) => logger.warn('Booking customer notification error', { error: (e as Error).message }));

      if (srv.OwnerUserId) {
        notificationService.createNotification({
          userId: Number(srv.OwnerUserId),
          notificationType: 'BOOKING_CONFIRMED',
          title: 'New Service Booking Received',
          message: `New booking #${created.bookingNumber} received for ${created.serviceTitle}.`,
          referenceType: 'Booking',
          referenceId: created.id,
        }).catch((e) => logger.warn('Booking seller notification error', { error: (e as Error).message }));
      }

      return created;
    } catch (error) {
      if (createdBookingId > 0) {
        try {
          await databaseService.query('DELETE FROM Payments WHERE BookingId = @bkId', [
            { name: 'bkId', type: mssql.BigInt(), value: createdBookingId },
          ]);
          await databaseService.query('DELETE FROM Bookings WHERE BookingId = @bkId', [
            { name: 'bkId', type: mssql.BigInt(), value: createdBookingId },
          ]);
        } catch (cleanErr) {
          logger.error('Failed to cleanup partial booking insert', { error: (cleanErr as Error).message });
        }
      }
      const err = error as Error;
      logger.error('Failed to create booking', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch customer's own bookings
   */
  async getMyBookings(requestingUserId: string): Promise<BookingDetail[]> {
    const customerUserId = await resolveDbUserId(requestingUserId);
    if (!customerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const bookingsRes = await databaseService.query<any>(
        `SELECT 
           b.BookingId, b.BookingNumber, b.ServiceId, b.CustomerUserId, b.ServiceProviderId,
           b.BusinessId, b.BookingDate, b.StartTime, b.EndTime, b.CustomerAddress,
           b.CustomerCity, b.CustomerState, b.CustomerPostalCode, b.Amount, b.CustomerNotes,
           b.ProviderNotes, b.Status, b.PaymentStatus, b.CreatedAt, b.UpdatedAt,
           s.ServiceName AS ServiceTitle, s.Price AS ServicePrice,
           biz.BusinessName,
           u.FirstName AS CustomerFirstName, u.LastName AS CustomerLastName
         FROM Bookings b WITH (NOLOCK)
         LEFT JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
         LEFT JOIN Businesses biz WITH (NOLOCK) ON b.BusinessId = biz.BusinessId
         LEFT JOIN Users u WITH (NOLOCK) ON b.CustomerUserId = u.UserId
         WHERE b.CustomerUserId = @custUserId
         ORDER BY b.BookingId DESC`,
        [{ name: 'custUserId', type: mssql.BigInt(), value: customerUserId }]
      );

      return (bookingsRes.recordset || []).map(mapDbRowToBooking);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query customer bookings', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch specific booking detail by ID with strict ownership authorization
   */
  async getBookingById(
    bookingIdStr: string,
    requestingUserId: string,
    requestingRole: string
  ): Promise<BookingDetail | null> {
    const numericBookingId = parseInt(bookingIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericBookingId)) return null;

    const dbUserId = await resolveDbUserId(requestingUserId);

    try {
      const bookingRes = await databaseService.query<any>(
        `SELECT 
           b.BookingId, b.BookingNumber, b.ServiceId, b.CustomerUserId, b.ServiceProviderId,
           b.BusinessId, b.BookingDate, b.StartTime, b.EndTime, b.CustomerAddress,
           b.CustomerCity, b.CustomerState, b.CustomerPostalCode, b.Amount, b.CustomerNotes,
           b.ProviderNotes, b.Status, b.PaymentStatus, b.CreatedAt, b.UpdatedAt,
           s.ServiceName AS ServiceTitle, s.Price AS ServicePrice,
           biz.BusinessName, biz.OwnerUserId AS BusinessOwnerUserId,
           u.FirstName AS CustomerFirstName, u.LastName AS CustomerLastName
         FROM Bookings b WITH (NOLOCK)
         INNER JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
         LEFT JOIN Businesses biz WITH (NOLOCK) ON b.BusinessId = biz.BusinessId
         INNER JOIN Users u WITH (NOLOCK) ON b.CustomerUserId = u.UserId
         WHERE b.BookingId = @bkId`,
        [{ name: 'bkId', type: mssql.BigInt(), value: numericBookingId }]
      );

      if (!bookingRes.recordset || bookingRes.recordset.length === 0) {
        return null;
      }

      const row = bookingRes.recordset[0];

      const isCustomerOwner = Number(row.CustomerUserId) === dbUserId;
      const isBusinessOwner = row.BusinessOwnerUserId && Number(row.BusinessOwnerUserId) === dbUserId;
      const isAdmin = requestingRole === 'administrator';

      if (!isCustomerOwner && !isBusinessOwner && !isAdmin) {
        throw new Error('FORBIDDEN_BOOKING_ACCESS');
      }

      return mapDbRowToBooking(row);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_BOOKING_ACCESS') {
        throw err;
      }
      logger.error('Failed to query booking by ID', { bookingIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch bookings related to seller's services/businesses
   */
  async getSellerBookings(requestingUserId: string, businessId?: string): Promise<BookingDetail[]> {
    const sellerUserId = await resolveDbUserId(requestingUserId);
    if (!sellerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const numericBizId = businessId ? parseInt(businessId.replace(/\D/g, ''), 10) : NaN;
      const hasBiz = !isNaN(numericBizId) && numericBizId > 0;

      const params: Array<{ name: string; type: any; value: any }> = [
        { name: 'sellerId', type: mssql.BigInt(), value: sellerUserId }
      ];
      let bizFilter = '';
      if (hasBiz) {
        bizFilter = ' AND b.BusinessId = @businessId';
        params.push({ name: 'businessId', type: mssql.BigInt(), value: numericBizId });
      }

      const bookingsRes = await databaseService.query<any>(
        `SELECT 
           b.BookingId, b.BookingNumber, b.ServiceId, b.CustomerUserId, b.ServiceProviderId,
           b.BusinessId, b.BookingDate, b.StartTime, b.EndTime, b.CustomerAddress,
           b.CustomerCity, b.CustomerState, b.CustomerPostalCode, b.Amount, b.CustomerNotes,
           b.ProviderNotes, b.Status, b.PaymentStatus, b.CreatedAt, b.UpdatedAt,
           s.ServiceName AS ServiceTitle, s.Price AS ServicePrice,
           biz.BusinessName,
           u.FirstName AS CustomerFirstName, u.LastName AS CustomerLastName
         FROM Bookings b WITH (NOLOCK)
         LEFT JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
         LEFT JOIN Businesses biz WITH (NOLOCK) ON b.BusinessId = biz.BusinessId
         LEFT JOIN Users u WITH (NOLOCK) ON b.CustomerUserId = u.UserId
         WHERE (biz.OwnerUserId = @sellerId OR b.ServiceProviderId = @sellerId)${bizFilter}
         ORDER BY b.BookingId DESC`,
        params
      );

      return (bookingsRes.recordset || []).map(mapDbRowToBooking);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller bookings', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Update booking status with authorization check
   */
  async updateBookingStatus(
    bookingIdStr: string,
    requestingUserId: string,
    requestingRole: string,
    newStatus: string
  ): Promise<BookingDetail> {
    const existing = await this.getBookingById(bookingIdStr, requestingUserId, requestingRole);
    if (!existing) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const formattedStatus = newStatus.toUpperCase().trim();
    if (!validStatuses.includes(formattedStatus)) {
      throw new Error(`INVALID_STATUS: Allowed statuses are ${validStatuses.join(', ')}`);
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const numericBookingId = parseInt(existing.id, 10);

    // Verify Seller ownership unless Admin or Customer self-canceling
    if (requestingRole !== 'administrator') {
      const isCustomer = existing.customerUserId === String(dbUserId);
      if (isCustomer && formattedStatus !== 'CANCELLED') {
        throw new Error('FORBIDDEN_STATUS_UPDATE');
      }

      if (!isCustomer) {
        const bizCheck = await databaseService.query<any>(
          `SELECT 1 FROM Bookings b
           INNER JOIN Businesses biz ON b.BusinessId = biz.BusinessId
           WHERE b.BookingId = @bkId AND biz.OwnerUserId = @sellerId`,
          [
            { name: 'bkId', type: mssql.BigInt(), value: numericBookingId },
            { name: 'sellerId', type: mssql.BigInt(), value: dbUserId },
          ]
        );

        if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
          throw new Error('FORBIDDEN_STATUS_UPDATE');
        }
      }
    }

    try {
      await databaseService.query(
        `UPDATE Bookings SET Status = @status, UpdatedAt = CURRENT_TIMESTAMP WHERE BookingId = @bkId`,
        [
          { name: 'status', type: mssql.VarChar(30), value: formattedStatus },
          { name: 'bkId', type: mssql.BigInt(), value: numericBookingId },
        ]
      );

      const updated = await this.getBookingById(bookingIdStr, requestingUserId, requestingRole);
      if (!updated) {
        throw new Error('Booking status updated but failed to reload record');
      }

      // Notify customer of booking status update
      notificationService.createNotification({
        userId: updated.customerUserId,
        notificationType: 'BOOKING_CONFIRMED',
        title: 'Booking Status Updated',
        message: `Booking #${updated.bookingNumber} status changed to ${updated.status}.`,
        referenceType: 'Booking',
        referenceId: updated.id,
      }).catch((e) => logger.warn('Booking status notification error', { error: (e as Error).message }));

      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update booking status', { bookingIdStr, newStatus, error: err.message });
      throw err;
    }
  },
};
