import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface CustomerDashboardData {
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
    totalOrders: number;
    pendingOrders: number;
    totalBookings: number;
    upcomingBookings: number;
    totalApplications: number;
    totalSavedItems: number;
    unreadNotifications: number;
    unreadMessages: number;
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
    status: string;
    appliedAt: string;
  }>;
  recentConversations: Array<{
    id: string;
    otherParticipantName: string;
    otherParticipantInitials: string;
    lastMessageText?: string;
    unreadCount: number;
    updatedAt?: string;
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

export const customerDashboardService = {
  async getDashboardData(userIdStr: string): Promise<CustomerDashboardData> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    try {
      // Execute independent dashboard queries in parallel using Promise.all
      const [
        userRes,
        ordersRes,
        recentOrdersRes,
        bookingsRes,
        upcomingBookingsRes,
        appsRes,
        recentAppsRes,
        favsRes,
        notifsRes,
      ] = await Promise.all([
        databaseService.query<any>(
          `SELECT UserId, FirstName, LastName, Email, Mobile, ProfileImageUrl, IsActive
           FROM Users WITH (NOLOCK)
           WHERE UserId = @dbUserId`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT 
             COUNT(*) AS totalOrders,
             SUM(CASE WHEN OrderStatus IN ('PENDING', 'PROCESSING', 'SHIPPED') THEN 1 ELSE 0 END) AS pendingOrders
           FROM Orders WITH (NOLOCK)
           WHERE CustomerUserId = @dbUserId`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT TOP 3 OrderId, OrderNumber, OrderStatus, TotalAmount, CreatedAt
           FROM Orders WITH (NOLOCK)
           WHERE CustomerUserId = @dbUserId
           ORDER BY OrderId DESC`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT 
             COUNT(*) AS totalBookings,
             SUM(CASE WHEN Status IN ('CONFIRMED', 'PENDING') THEN 1 ELSE 0 END) AS upcomingBookings
           FROM Bookings WITH (NOLOCK)
           WHERE CustomerUserId = @dbUserId`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT TOP 3 b.BookingId, b.BookingNumber, s.ServiceName AS ServiceTitle, b.BookingDate, b.StartTime, b.Status
           FROM Bookings b WITH (NOLOCK)
           LEFT JOIN Services s WITH (NOLOCK) ON b.ServiceId = s.ServiceId
           WHERE b.CustomerUserId = @dbUserId AND b.Status IN ('CONFIRMED', 'PENDING')
           ORDER BY b.BookingDate ASC`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT COUNT(*) AS totalApplications
           FROM JobApplications WITH (NOLOCK)
           WHERE ApplicantUserId = @dbUserId`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT TOP 3 ja.ApplicationId, j.JobTitle, ja.Status, ja.AppliedAt
           FROM JobApplications ja WITH (NOLOCK)
           LEFT JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
           WHERE ja.ApplicantUserId = @dbUserId
           ORDER BY ja.ApplicationId DESC`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT 
             (SELECT COUNT(*) FROM SavedServices WITH (NOLOCK) WHERE UserId = @dbUserId) +
             (SELECT COUNT(*) FROM SavedProducts WITH (NOLOCK) WHERE UserId = @dbUserId) +
             (SELECT COUNT(*) FROM SavedJobs WITH (NOLOCK) WHERE UserId = @dbUserId) +
             (SELECT COUNT(*) FROM UserFollows WITH (NOLOCK) WHERE FollowerUserId = @dbUserId) AS totalSavedItems`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
        databaseService.query<any>(
          `SELECT COUNT(*) AS unreadNotifications
           FROM Notifications WITH (NOLOCK)
           WHERE UserId = @dbUserId AND IsRead = 0`,
          [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
        ),
      ]);
      if (!userRes.recordset || userRes.recordset.length === 0) {
        throw new Error('NOT_FOUND: User profile not found');
      }

      const u = userRes.recordset[0];
      const fullName = `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'ECOSPHERE User';

      const totalOrders = Number(ordersRes.recordset?.[0]?.totalOrders || 0);
      const pendingOrders = Number(ordersRes.recordset?.[0]?.pendingOrders || 0);
      const totalBookings = Number(bookingsRes.recordset?.[0]?.totalBookings || 0);
      const upcomingBookingsCount = Number(bookingsRes.recordset?.[0]?.upcomingBookings || 0);
      const totalApplications = Number(appsRes.recordset?.[0]?.totalApplications || 0);
      const totalSavedItems = Number(favsRes.recordset?.[0]?.totalSavedItems || 0);
      const unreadNotifications = Number(notifsRes.recordset?.[0]?.unreadNotifications || 0);

      // 7. Conversations & Messages stats
      const convRes = await databaseService.query<any>(
        `SELECT 
           c.ConversationId, c.UpdatedAt, c.CreatedAt,
           cp.LastReadAt,
           op.UserId AS OtherUserId,
           ou.FirstName AS OtherFirstName, ou.LastName AS OtherLastName
         FROM ConversationParticipants cp WITH (NOLOCK)
         INNER JOIN Conversations c WITH (NOLOCK) ON cp.ConversationId = c.ConversationId
         INNER JOIN ConversationParticipants op WITH (NOLOCK) ON c.ConversationId = op.ConversationId AND op.UserId <> @dbUserId AND op.IsActive = 1
         INNER JOIN Users ou WITH (NOLOCK) ON op.UserId = ou.UserId
         WHERE cp.UserId = @dbUserId AND cp.IsActive = 1 AND c.IsActive = 1
         ORDER BY COALESCE(c.UpdatedAt, c.CreatedAt) DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      let totalUnreadMessages = 0;
      const recentConversations = [];

      for (const r of convRes.recordset || []) {
        const convId = Number(r.ConversationId);
        const otherName = `${r.OtherFirstName || ''} ${r.OtherLastName || ''}`.trim() || 'ECOSPHERE User';
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
        const unreadCount = Number(unreadRes.recordset?.[0]?.unread || 0);
        totalUnreadMessages += unreadCount;

        if (recentConversations.length < 3) {
          const lastMsgRes = await databaseService.query<any>(
            `SELECT TOP 1 MessageText, IsDeleted
             FROM Messages WITH (NOLOCK)
             WHERE ConversationId = @convId
             ORDER BY MessageId DESC`,
            [{ name: 'convId', type: mssql.BigInt(), value: convId }]
          );
          const lm = lastMsgRes.recordset?.[0];
          const lastMessageText = lm ? (lm.IsDeleted ? 'This message was deleted' : lm.MessageText) : undefined;

          recentConversations.push({
            id: String(convId),
            otherParticipantName: otherName,
            otherParticipantInitials: getInitials(otherName),
            lastMessageText,
            unreadCount,
            updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : new Date(r.CreatedAt).toISOString(),
          });
        }
      }

      return {
        profile: {
          userId: String(u.UserId),
          firstName: u.FirstName || '',
          lastName: u.LastName || '',
          fullName,
          email: u.Email || '',
          mobile: u.Mobile || '',
          role: 'customer',
          avatarInitials: getInitials(fullName),
          profileImageUrl: u.ProfileImageUrl || undefined,
        },
        stats: {
          totalOrders,
          pendingOrders,
          totalBookings,
          upcomingBookings: upcomingBookingsCount,
          totalApplications,
          totalSavedItems,
          unreadNotifications,
          unreadMessages: totalUnreadMessages,
        },
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
          serviceTitle: r.ServiceTitle || 'Local Service',
          bookingDate: r.BookingDate ? new Date(r.BookingDate).toISOString().split('T')[0] : '',
          bookingTime: r.BookingSlot || '10:00 AM',
          status: r.Status || 'CONFIRMED',
        })),
        recentApplications: (recentAppsRes.recordset || []).map((r: any) => ({
          id: String(r.ApplicationId),
          jobTitle: r.JobTitle || 'Job Role',
          status: r.Status || 'SUBMITTED',
          appliedAt: r.AppliedAt ? new Date(r.AppliedAt).toISOString() : new Date().toISOString(),
        })),
        recentConversations,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching customer dashboard data', { userIdStr, error: err.message });
      throw err;
    }
  },
};
