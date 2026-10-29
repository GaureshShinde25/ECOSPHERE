import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface SellerDashboardData {
  profile: {
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    mobile: string;
    role: string;
    avatarInitials: string;
    profileImageUrl?: string;
  };
  stats: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalServices: number;
    totalProducts: number;
    totalJobs: number;
    totalApplications: number;
    pendingApplications: number;
    totalOrders: number;
    pendingOrders: number;
    totalBookings: number;
    upcomingBookings: number;
    totalEarnings: number;
    averageRating: number;
    reviewCount: number;
    unreadMessages: number;
    unreadNotifications: number;
  };
  primaryBusiness?: {
    id: string;
    name: string;
    businessName?: string;
    city: string;
    state: string;
    verificationStatus: string;
    rating: number;
    reviewCount: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    orderStatus: string;
    totalAmount: number;
    createdAt: string;
  }>;
  upcomingBookings: Array<{
    id: string;
    bookingNumber: string;
    serviceTitle: string;
    bookingDate: string;
    bookingTime: string;
    status: string;
  }>;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    applicantName: string;
    status: string;
    appliedAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  if (!userIdStr) return 0;
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0) {
    const userById = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE UserId = @numId',
      [{ name: 'numId', type: mssql.BigInt(), value: directId }]
    );
    if (userById.recordset && userById.recordset.length > 0) {
      return Number(userById.recordset[0].UserId);
    }
  }

  return 0;
}

function getInitials(name?: string): string {
  if (!name) return 'ES';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const sellerDashboardService = {
  async getDashboardData(userIdStr: string, activeBusinessId?: string): Promise<SellerDashboardData> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    try {
      // 1. Profile query
      const userRes = await databaseService.query<any>(
        `SELECT UserId, FirstName, LastName, Email, Mobile, ProfileImageUrl
         FROM Users WITH (NOLOCK)
         WHERE UserId = @dbUserId`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      if (!userRes.recordset || userRes.recordset.length === 0) {
        throw new Error('NOT_FOUND: Seller profile not found');
      }

      const u = userRes.recordset[0];
      const fullName = `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'ECOSPHERE Seller';

      // 2. Businesses stats & primary business
      const bizRes = await databaseService.query<any>(
        `SELECT BusinessId, BusinessName, City, State, VerificationStatus, Rating, ReviewCount, IsActive
         FROM Businesses WITH (NOLOCK)
         WHERE OwnerUserId = @dbUserId
         ORDER BY BusinessId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const allBiz = bizRes.recordset || [];
      const totalBusinesses = allBiz.length;
      const activeBusinesses = allBiz.filter((b: any) => b.IsActive).length;

      const numericBizId = activeBusinessId ? parseInt(activeBusinessId.replace(/\D/g, ''), 10) : NaN;
      const targetBiz = (!isNaN(numericBizId) && allBiz.find((b: any) => Number(b.BusinessId) === numericBizId)) || (allBiz.length > 0 ? allBiz[0] : null);

      let primaryBusiness;
      if (targetBiz) {
        primaryBusiness = {
          id: String(targetBiz.BusinessId),
          name: targetBiz.BusinessName || 'My Business',
          businessName: targetBiz.BusinessName || 'My Business',
          city: targetBiz.City || 'Pune',
          state: targetBiz.State || 'Maharashtra',
          verificationStatus: targetBiz.VerificationStatus || 'VERIFIED',
          rating: Number(targetBiz.Rating || 4.5),
          reviewCount: Number(targetBiz.ReviewCount || 0),
        };
      }

      const hasSpecificBiz = targetBiz !== null && targetBiz !== undefined;
      const specificBizId = hasSpecificBiz ? Number(targetBiz.BusinessId) : 0;

      // 3. Services count
      const srvRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT COUNT(*) AS total FROM Services WITH (NOLOCK) WHERE BusinessId = @targetBizId`
          : `SELECT COUNT(*) AS total FROM Services WITH (NOLOCK) WHERE ServiceProviderId = @dbUserId OR BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalServices = Number(srvRes.recordset?.[0]?.total || 0);

      // 4. Products count
      const prodRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT COUNT(*) AS total FROM Products WITH (NOLOCK) WHERE BusinessId = @targetBizId`
          : `SELECT COUNT(*) AS total FROM Products WITH (NOLOCK) WHERE BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalProducts = Number(prodRes.recordset?.[0]?.total || 0);

      // 5. Jobs & Job Applications
      const jobsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT COUNT(*) AS total FROM Jobs WITH (NOLOCK) WHERE BusinessId = @targetBizId`
          : `SELECT COUNT(*) AS total FROM Jobs WITH (NOLOCK) WHERE EmployerUserId = @dbUserId OR BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalJobs = Number(jobsRes.recordset?.[0]?.total || 0);

      const appsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT 
               COUNT(*) AS totalApps,
               SUM(CASE WHEN ja.Status = 'SUBMITTED' THEN 1 ELSE 0 END) AS pendingApps
             FROM JobApplications ja WITH (NOLOCK)
             INNER JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
             WHERE j.BusinessId = @targetBizId`
          : `SELECT 
               COUNT(*) AS totalApps,
               SUM(CASE WHEN ja.Status = 'SUBMITTED' THEN 1 ELSE 0 END) AS pendingApps
             FROM JobApplications ja WITH (NOLOCK)
             INNER JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
             WHERE j.EmployerUserId = @dbUserId OR j.BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalApplications = Number(appsRes.recordset?.[0]?.totalApps || 0);
      const pendingApplications = Number(appsRes.recordset?.[0]?.pendingApps || 0);

      const recentAppsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT TOP 5 ja.ApplicationId, j.JobTitle, u.FirstName, u.LastName, ja.Status, ja.AppliedAt
             FROM JobApplications ja WITH (NOLOCK)
             INNER JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
             LEFT JOIN Users u WITH (NOLOCK) ON ja.ApplicantUserId = u.UserId
             WHERE j.BusinessId = @targetBizId
             ORDER BY ja.ApplicationId DESC`
          : `SELECT TOP 5 ja.ApplicationId, j.JobTitle, u.FirstName, u.LastName, ja.Status, ja.AppliedAt
             FROM JobApplications ja WITH (NOLOCK)
             INNER JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
             LEFT JOIN Users u WITH (NOLOCK) ON ja.ApplicantUserId = u.UserId
             WHERE j.EmployerUserId = @dbUserId OR j.BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)
             ORDER BY ja.ApplicationId DESC`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      // 6. Orders
      const ordersRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT 
               COUNT(*) AS totalOrders,
               SUM(CASE WHEN OrderStatus IN ('PENDING', 'PROCESSING') THEN 1 ELSE 0 END) AS pendingOrders
             FROM Orders WITH (NOLOCK)
             WHERE BusinessId = @targetBizId`
          : `SELECT 
               COUNT(*) AS totalOrders,
               SUM(CASE WHEN OrderStatus IN ('PENDING', 'PROCESSING') THEN 1 ELSE 0 END) AS pendingOrders
             FROM Orders WITH (NOLOCK)
             WHERE BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalOrders = Number(ordersRes.recordset?.[0]?.totalOrders || 0);
      const pendingOrders = Number(ordersRes.recordset?.[0]?.pendingOrders || 0);

      const recentOrdersRes = await databaseService.query<any>(
        `SELECT TOP 5 OrderId, OrderNumber, OrderStatus, TotalAmount, CreatedAt
         FROM Orders WITH (NOLOCK)
         WHERE BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)
         ORDER BY OrderId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      // 7. Bookings
      const bookingsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT 
               COUNT(*) AS totalBookings,
               SUM(CASE WHEN Status IN ('CONFIRMED', 'PENDING') THEN 1 ELSE 0 END) AS upcomingBookings
             FROM Bookings WITH (NOLOCK)
             WHERE BusinessId = @targetBizId`
          : `SELECT 
               COUNT(*) AS totalBookings,
               SUM(CASE WHEN Status IN ('CONFIRMED', 'PENDING') THEN 1 ELSE 0 END) AS upcomingBookings
             FROM Bookings WITH (NOLOCK)
             WHERE ServiceProviderId = @dbUserId OR BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalBookings = Number(bookingsRes.recordset?.[0]?.totalBookings || 0);
      const upcomingBookingsCount = Number(bookingsRes.recordset?.[0]?.upcomingBookings || 0);

      const upcomingBookingsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT TOP 5 b.BookingId, b.BookingNumber, s.ServiceName AS ServiceTitle, b.BookingDate, b.StartTime, b.Status
             FROM Bookings b WITH (NOLOCK)
             LEFT JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
             WHERE b.BusinessId = @targetBizId
               AND b.Status IN ('CONFIRMED', 'PENDING')
             ORDER BY b.BookingDate ASC`
          : `SELECT TOP 5 b.BookingId, b.BookingNumber, s.ServiceName AS ServiceTitle, b.BookingDate, b.StartTime, b.Status
             FROM Bookings b WITH (NOLOCK)
             LEFT JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
             WHERE (b.ServiceProviderId = @dbUserId OR b.BusinessId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId))
               AND b.Status IN ('CONFIRMED', 'PENDING')
             ORDER BY b.BookingDate ASC`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      // 8. Earnings & Payments
      const earningsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT 
               (SELECT COALESCE(SUM(p.Amount), 0) 
                FROM Payments p WITH (NOLOCK) 
                INNER JOIN Orders o WITH (NOLOCK) ON p.OrderId = o.OrderId 
                WHERE p.Status IN ('COMPLETED', 'SUCCESS') AND o.BusinessId = @targetBizId)
               +
               (SELECT COALESCE(SUM(p.Amount), 0) 
                FROM Payments p WITH (NOLOCK) 
                INNER JOIN Bookings b WITH (NOLOCK) ON p.BookingId = b.BookingId 
                WHERE p.Status IN ('COMPLETED', 'SUCCESS') AND b.BusinessId = @targetBizId) 
             AS totalEarnings`
          : `SELECT 
               (SELECT COALESCE(SUM(p.Amount), 0) 
                FROM Payments p WITH (NOLOCK) 
                INNER JOIN Orders o WITH (NOLOCK) ON p.OrderId = o.OrderId 
                INNER JOIN Businesses b WITH (NOLOCK) ON o.BusinessId = b.BusinessId
                WHERE p.Status IN ('COMPLETED', 'SUCCESS') AND b.OwnerUserId = @dbUserId)
               +
               (SELECT COALESCE(SUM(p.Amount), 0) 
                FROM Payments p WITH (NOLOCK) 
                INNER JOIN Bookings bk WITH (NOLOCK) ON p.BookingId = bk.BookingId 
                LEFT JOIN Businesses b WITH (NOLOCK) ON bk.BusinessId = b.BusinessId
                WHERE p.Status IN ('COMPLETED', 'SUCCESS') AND (bk.ServiceProviderId = @dbUserId OR b.OwnerUserId = @dbUserId)) 
             AS totalEarnings`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const totalEarnings = Number(earningsRes.recordset?.[0]?.totalEarnings || 0);

      const recentPaymentsRes = await databaseService.query<any>(
        hasSpecificBiz
          ? `SELECT TOP 5 p.PaymentId, p.PaymentReference AS PaymentNumber, p.Amount, p.PaymentMethod, p.Status AS PaymentStatus, p.CreatedAt
             FROM Payments p WITH (NOLOCK)
             LEFT JOIN Orders o WITH (NOLOCK) ON p.OrderId = o.OrderId
             LEFT JOIN Bookings b WITH (NOLOCK) ON p.BookingId = b.BookingId
             WHERE o.BusinessId = @targetBizId OR b.BusinessId = @targetBizId
             ORDER BY p.PaymentId DESC`
          : `SELECT TOP 5 p.PaymentId, p.PaymentReference AS PaymentNumber, p.Amount, p.PaymentMethod, p.Status AS PaymentStatus, p.CreatedAt
             FROM Payments p WITH (NOLOCK)
             LEFT JOIN Orders o WITH (NOLOCK) ON p.OrderId = o.OrderId
             LEFT JOIN Businesses ob WITH (NOLOCK) ON o.BusinessId = ob.BusinessId
             LEFT JOIN Bookings b WITH (NOLOCK) ON p.BookingId = b.BookingId
             LEFT JOIN Businesses bb WITH (NOLOCK) ON b.BusinessId = bb.BusinessId
             WHERE ob.OwnerUserId = @dbUserId OR bb.OwnerUserId = @dbUserId OR b.ServiceProviderId = @dbUserId
             ORDER BY p.PaymentId DESC`,
        hasSpecificBiz
          ? [{ name: 'targetBizId', type: mssql.BigInt(), value: specificBizId }]
          : [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      // 9. Reviews stats
      const reviewsRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS reviewCount, COALESCE(AVG(CAST(Rating AS float)), 0) AS avgRating
         FROM Reviews WITH (NOLOCK)
         WHERE TargetType = 'BUSINESS' AND TargetId IN (SELECT BusinessId FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @dbUserId)`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const reviewCount = Number(reviewsRes.recordset?.[0]?.reviewCount || 0);
      const averageRating = Number(reviewsRes.recordset?.[0]?.avgRating || 0);

      // 10. Unread Notifications & Conversations
      const notifRes = await databaseService.query<any>(
        `SELECT SUM(CASE WHEN IsRead = 0 THEN 1 ELSE 0 END) AS unread
         FROM Notifications WITH (NOLOCK)
         WHERE UserId = @dbUserId`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );
      const unreadNotifications = Number(notifRes.recordset?.[0]?.unread || 0);

      const convRes = await databaseService.query<any>(
        `SELECT c.ConversationId, cp.LastReadAt
         FROM ConversationParticipants cp WITH (NOLOCK)
         INNER JOIN Conversations c WITH (NOLOCK) ON cp.ConversationId = c.ConversationId
         WHERE cp.UserId = @dbUserId AND cp.IsActive = 1 AND c.IsActive = 1`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      let unreadMessages = 0;
      for (const r of convRes.recordset || []) {
        const convId = Number(r.ConversationId);
        const lastReadAt = r.LastReadAt ? new Date(r.LastReadAt) : new Date(0);
        const unreadRes = await databaseService.query<any>(
          `SELECT COUNT(*) AS unread
           FROM Messages WITH (NOLOCK)
           WHERE ConversationId = @convId AND SenderUserId <> @dbUserId AND SentAt > @lastReadAt AND IsDeleted = 0`,
          [
            { name: 'convId', type: mssql.BigInt(), value: convId },
            { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
            { name: 'lastReadAt', type: mssql.DateTime2(), value: lastReadAt },
          ]
        );
        unreadMessages += Number(unreadRes.recordset?.[0]?.unread || 0);
      }

      return {
        profile: {
          userId: String(u.UserId),
          firstName: u.FirstName || '',
          lastName: u.LastName || '',
          fullName,
          email: u.Email || '',
          mobile: u.Mobile || '',
          role: 'seller',
          avatarInitials: getInitials(fullName),
          profileImageUrl: u.ProfileImageUrl || undefined,
        },
        stats: {
          totalBusinesses,
          activeBusinesses,
          totalServices,
          totalProducts,
          totalJobs,
          totalApplications,
          pendingApplications,
          totalOrders,
          pendingOrders,
          totalBookings,
          upcomingBookings: upcomingBookingsCount,
          totalEarnings,
          averageRating: parseFloat(averageRating.toFixed(1)),
          reviewCount,
          unreadMessages,
          unreadNotifications,
        },
        primaryBusiness,
        recentOrders: (recentOrdersRes.recordset || []).map((r: any) => ({
          id: String(r.OrderId),
          orderNumber: r.OrderNumber || `ORD-${r.OrderId}`,
          orderStatus: r.OrderStatus || 'PENDING',
          totalAmount: Number(r.TotalAmount || 0),
          createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
        })),
        upcomingBookings: (upcomingBookingsRes.recordset || []).map((r: any) => ({
          id: String(r.BookingId),
          bookingNumber: r.BookingNumber || `BKG-${r.BookingId}`,
          serviceTitle: r.ServiceTitle || 'Service Booking',
          bookingDate: r.BookingDate ? new Date(r.BookingDate).toISOString().split('T')[0] : '',
          bookingTime: r.StartTime || '10:00 AM',
          status: r.Status || 'CONFIRMED',
        })),
        recentApplications: (recentAppsRes.recordset || []).map((r: any) => ({
          id: String(r.ApplicationId),
          jobTitle: r.JobTitle || 'Job Role',
          applicantName: `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'Applicant',
          status: r.Status || 'SUBMITTED',
          appliedAt: r.AppliedAt ? new Date(r.AppliedAt).toISOString() : new Date().toISOString(),
        })),
        recentPayments: (recentPaymentsRes.recordset || []).map((r: any) => ({
          id: String(r.PaymentId),
          paymentNumber: r.PaymentNumber || `PAY-${r.PaymentId}`,
          amount: Number(r.Amount || 0),
          paymentMethod: r.PaymentMethod || 'UPI',
          paymentStatus: r.PaymentStatus || 'COMPLETED',
          createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
        })),
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching seller dashboard data', { userIdStr, error: err.message });
      throw err;
    }
  },
};
