import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface AdminDashboardData {
  stats: {
    users: {
      total: number;
      active: number;
      blocked: number;
      customers: number;
      sellers: number;
      administrators: number;
    };
    businesses: {
      total: number;
      active: number;
      verified: number;
      pendingVerification: number;
    };
    services: {
      total: number;
      active: number;
    };
    products: {
      total: number;
      active: number;
    };
    jobs: {
      total: number;
      active: number;
    };
    applications: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
    };
    orders: {
      total: number;
      pending: number;
      completed: number;
      cancelled: number;
    };
    bookings: {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    payments: {
      totalTransactions: number;
      completedTransactions: number;
      totalRevenue: number;
    };
    community: {
      totalPosts: number;
      totalComments: number;
    };
    reviews: {
      total: number;
      averageRating: number;
    };
  };
  recentUsers: Array<{
    userId: string;
    fullName: string;
    mobile: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentBusinesses: Array<{
    businessId: string;
    businessName: string;
    city: string;
    verificationStatus: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentOrders: Array<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    paymentId: string;
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
}

export const adminService = {
  /**
   * Log an administrative action into AuditLogs table
   */
  async logAdminAction(
    adminUserId: number,
    actionType: string,
    moduleName: string,
    entityType: string,
    entityId: string,
    oldValues?: string,
    newValues?: string
  ): Promise<void> {
    try {
      await databaseService.query(
        `INSERT INTO AuditLogs (UserId, ActionType, ModuleName, EntityType, EntityId, OldValues, NewValues, CreatedAt)
         VALUES (@adminUserId, @actionType, @moduleName, @entityType, @entityId, @oldValues, @newValues, GETDATE())`,
        [
          { name: 'adminUserId', type: mssql.BigInt(), value: adminUserId },
          { name: 'actionType', type: mssql.NVarChar(100), value: actionType },
          { name: 'moduleName', type: mssql.NVarChar(100), value: moduleName },
          { name: 'entityType', type: mssql.NVarChar(100), value: entityType },
          { name: 'entityId', type: mssql.NVarChar(100), value: entityId },
          { name: 'oldValues', type: mssql.NVarChar(mssql.MAX), value: oldValues || null },
          { name: 'newValues', type: mssql.NVarChar(mssql.MAX), value: newValues || null },
        ]
      );
    } catch (err) {
      logger.error('Failed to write audit log', { error: (err as Error).message });
    }
  },

  /**
   * GET /api/admin/dashboard
   */
  async getDashboardData(): Promise<AdminDashboardData> {
    const [
      userRes,
      userRolesRes,
      bizRes,
      srvRes,
      prodRes,
      jobsRes,
      appsRes,
      ordersRes,
      bookingsRes,
      paymentsRes,
      postsRes,
      commentsRes,
      reviewsRes,
      recentUsersRes,
      recentBizRes,
      recentOrdersRes,
      recentPaymentsRes,
    ] = await Promise.all([
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN IsActive = 1 AND COALESCE(IsBlocked, 0) = 0 THEN 1 ELSE 0 END) AS active,
           SUM(CASE WHEN IsActive = 0 OR IsBlocked = 1 THEN 1 ELSE 0 END) AS blocked
         FROM Users WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT r.RoleName, COUNT(*) AS count
         FROM UserRoles ur WITH (NOLOCK)
         INNER JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
         GROUP BY r.RoleName`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active,
           SUM(CASE WHEN VerificationStatus IN ('VERIFIED', 'APPROVED') THEN 1 ELSE 0 END) AS verified,
           SUM(CASE WHEN VerificationStatus = 'PENDING' THEN 1 ELSE 0 END) AS pendingVerification
         FROM Businesses WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active
         FROM Services WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active
         FROM Products WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS active
         FROM Jobs WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN Status = 'SUBMITTED' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN Status = 'ACCEPTED' THEN 1 ELSE 0 END) AS accepted,
           SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected
         FROM JobApplications WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN OrderStatus = 'PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN OrderStatus = 'DELIVERED' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN OrderStatus = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
         FROM Orders WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS total,
           SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
           SUM(CASE WHEN Status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
         FROM Bookings WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT 
           COUNT(*) AS totalTransactions,
           SUM(CASE WHEN Status IN ('COMPLETED', 'SUCCESS') THEN 1 ELSE 0 END) AS completedTransactions,
           COALESCE(SUM(CASE WHEN Status IN ('COMPLETED', 'SUCCESS') THEN Amount ELSE 0 END), 0) AS totalRevenue
         FROM Payments WITH (NOLOCK)`
      ),
      databaseService.query<any>('SELECT COUNT(*) AS total FROM CommunityPosts WITH (NOLOCK)'),
      databaseService.query<any>('SELECT COUNT(*) AS total FROM CommunityPostComments WITH (NOLOCK)'),
      databaseService.query<any>(
        `SELECT COUNT(*) AS total, COALESCE(AVG(CAST(Rating AS float)), 0) AS avgRating
         FROM Reviews WITH (NOLOCK)`
      ),
      databaseService.query<any>(
        `SELECT TOP 5 UserId, FirstName, LastName, Mobile, Email, IsActive, CreatedAt
         FROM Users WITH (NOLOCK)
         ORDER BY UserId DESC`
      ),
      databaseService.query<any>(
        `SELECT TOP 5 BusinessId, BusinessName, City, VerificationStatus, IsActive, CreatedAt
         FROM Businesses WITH (NOLOCK)
         ORDER BY BusinessId DESC`
      ),
      databaseService.query<any>(
        `SELECT TOP 5 OrderId, OrderNumber, TotalAmount, OrderStatus, CreatedAt
         FROM Orders WITH (NOLOCK)
         ORDER BY OrderId DESC`
      ),
      databaseService.query<any>(
        `SELECT TOP 5 PaymentId, PaymentReference AS PaymentNumber, Amount, PaymentMethod, Status, CreatedAt
         FROM Payments WITH (NOLOCK)
         ORDER BY PaymentId DESC`
      ),
    ]);

    const rolesMap: Record<string, number> = {};
    for (const row of userRolesRes.recordset || []) {
      rolesMap[String(row.RoleName).toLowerCase()] = Number(row.count || 0);
    }

    const uRow = userRes.recordset?.[0] || {};
    const bRow = bizRes.recordset?.[0] || {};
    const sRow = srvRes.recordset?.[0] || {};
    const pRow = prodRes.recordset?.[0] || {};
    const jRow = jobsRes.recordset?.[0] || {};
    const aRow = appsRes.recordset?.[0] || {};
    const oRow = ordersRes.recordset?.[0] || {};
    const bkRow = bookingsRes.recordset?.[0] || {};
    const payRow = paymentsRes.recordset?.[0] || {};
    const rRow = reviewsRes.recordset?.[0] || {};

    return {
      stats: {
        users: {
          total: Number(uRow.total || 0),
          active: Number(uRow.active || 0),
          blocked: Number(uRow.blocked || 0),
          customers: Number(rolesMap['customer'] || 0),
          sellers: Number(rolesMap['seller'] || 0),
          administrators: Number(rolesMap['administrator'] || 0),
        },
        businesses: {
          total: Number(bRow.total || 0),
          active: Number(bRow.active || 0),
          verified: Number(bRow.verified || 0),
          pendingVerification: Number(bRow.pendingVerification || 0),
        },
        services: {
          total: Number(sRow.total || 0),
          active: Number(sRow.active || 0),
        },
        products: {
          total: Number(pRow.total || 0),
          active: Number(pRow.active || 0),
        },
        jobs: {
          total: Number(jRow.total || 0),
          active: Number(jRow.active || 0),
        },
        applications: {
          total: Number(aRow.total || 0),
          pending: Number(aRow.pending || 0),
          accepted: Number(aRow.accepted || 0),
          rejected: Number(aRow.rejected || 0),
        },
        orders: {
          total: Number(oRow.total || 0),
          pending: Number(oRow.pending || 0),
          completed: Number(oRow.completed || 0),
          cancelled: Number(oRow.cancelled || 0),
        },
        bookings: {
          total: Number(bkRow.total || 0),
          pending: Number(bkRow.pending || 0),
          confirmed: Number(bkRow.confirmed || 0),
          completed: Number(bkRow.completed || 0),
          cancelled: Number(bkRow.cancelled || 0),
        },
        payments: {
          totalTransactions: Number(payRow.totalTransactions || 0),
          completedTransactions: Number(payRow.completedTransactions || 0),
          totalRevenue: Number(payRow.totalRevenue || 0),
        },
        community: {
          totalPosts: Number(postsRes.recordset?.[0]?.total || 0),
          totalComments: Number(commentsRes.recordset?.[0]?.total || 0),
        },
        reviews: {
          total: Number(rRow.total || 0),
          averageRating: parseFloat(Number(rRow.avgRating || 0).toFixed(1)),
        },
      },
      recentUsers: (recentUsersRes.recordset || []).map((r: any) => ({
        userId: String(r.UserId),
        fullName: `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'User',
        mobile: r.Mobile || '',
        email: r.Email || '',
        role: 'customer',
        isActive: Boolean(r.IsActive),
        createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
      })),
      recentBusinesses: (recentBizRes.recordset || []).map((r: any) => ({
        businessId: String(r.BusinessId),
        businessName: r.BusinessName || 'Business',
        city: r.City || 'Pune',
        verificationStatus: r.VerificationStatus || 'VERIFIED',
        isActive: Boolean(r.IsActive),
        createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
      })),
      recentOrders: (recentOrdersRes.recordset || []).map((r: any) => ({
        orderId: String(r.OrderId),
        orderNumber: r.OrderNumber || `ORD-${r.OrderId}`,
        totalAmount: Number(r.TotalAmount || 0),
        orderStatus: r.OrderStatus || 'PENDING',
        createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
      })),
      recentPayments: (recentPaymentsRes.recordset || []).map((r: any) => ({
        paymentId: String(r.PaymentId),
        paymentNumber: r.PaymentNumber || `PAY-${r.PaymentId}`,
        amount: Number(r.Amount || 0),
        paymentMethod: r.PaymentMethod || 'UPI',
        status: r.Status || 'COMPLETED',
        createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
      })),
    };
  },

  /**
   * GET /api/admin/users
   */
  async getUsers(page = 1, limit = 20, search = ''): Promise<{ users: any[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: Array<{ name: string; type: any; value: any }> = [
      { name: 'offset', type: mssql.Int(), value: offset },
      { name: 'limit', type: mssql.Int(), value: limit },
    ];

    if (search.trim()) {
      whereClause += ' AND (u.FirstName LIKE @search OR u.LastName LIKE @search OR u.Mobile LIKE @search OR u.Email LIKE @search)';
      params.push({ name: 'search', type: mssql.NVarChar(100), value: `%${search.trim()}%` });
    }

    const countRes = await databaseService.query<any>(
      `SELECT COUNT(*) AS total FROM Users u WITH (NOLOCK) ${whereClause}`,
      params.filter((p) => p.name === 'search')
    );
    const total = Number(countRes.recordset?.[0]?.total || 0);

    const listRes = await databaseService.query<any>(
      `SELECT 
         u.UserId, 
         u.FirstName, 
         u.LastName, 
         u.Mobile, 
         u.Email, 
         u.IsActive, 
         u.IsBlocked, 
         u.CreatedAt,
         COALESCE(
           (SELECT TOP 1 r2.RoleCode 
            FROM UserRoles ur2 WITH (NOLOCK)
            JOIN Roles r2 WITH (NOLOCK) ON ur2.RoleId = r2.RoleId 
            WHERE ur2.UserId = u.UserId AND ur2.IsActive = 1 
            ORDER BY CASE WHEN r2.RoleCode = 'administrator' THEN 1 WHEN r2.RoleCode = 'seller' THEN 2 ELSE 3 END),
           'customer'
         ) AS RoleCode
       FROM Users u WITH (NOLOCK)
       ${whereClause}
       ORDER BY u.UserId DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    return {
      users: (listRes.recordset || []).map((u: any) => {
        const rawRole = (u.RoleCode || '').toLowerCase();
        const role = ['customer', 'seller', 'administrator'].includes(rawRole) ? rawRole : 'customer';
        const status = u.IsBlocked ? 'deleted' : (!u.IsActive ? 'suspended' : 'active');
        const fullName = `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'User';
        const mobile = u.Mobile || '';

        return {
          userId: String(u.UserId),
          fullName,
          email: u.Email || '',
          phoneNumber: mobile,
          mobile, // backward compatibility
          role,
          status,
          isActive: Boolean(u.IsActive && !u.IsBlocked),
          isDeleted: Boolean(u.IsBlocked),
          createdAt: u.CreatedAt ? new Date(u.CreatedAt).toISOString() : new Date().toISOString(),
        };
      }),
      total,
    };
  },

  /**
   * PUT /api/admin/users/:id/status
   */
  async updateUserStatus(adminUserId: number, targetUserId: number, isActive: boolean): Promise<boolean> {
    if (adminUserId === targetUserId && !isActive) {
      throw new Error('FORBIDDEN: Admin cannot block their own account');
    }

    const checkRes = await databaseService.query<any>(
      `SELECT TOP 1 IsBlocked FROM Users WITH (NOLOCK) WHERE UserId = @targetUserId`,
      [{ name: 'targetUserId', type: mssql.BigInt(), value: targetUserId }]
    );
    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('User not found.');
    }
    if (checkRes.recordset[0].IsBlocked) {
      throw new Error('Cannot update status of a deleted user account.');
    }

    const res = await databaseService.query<any>(
      `UPDATE Users SET IsActive = @isActive, UpdatedAt = GETDATE() WHERE UserId = @targetUserId AND IsBlocked = 0`,
      [
        { name: 'isActive', type: mssql.Bit(), value: isActive ? 1 : 0 },
        { name: 'targetUserId', type: mssql.BigInt(), value: targetUserId },
      ]
    );

    await this.logAdminAction(
      adminUserId,
      isActive ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
      'USER_MANAGEMENT',
      'USER',
      String(targetUserId),
      undefined,
      JSON.stringify({ isActive })
    );

    // Notify affected user
    notificationService.createNotification({
      userId: targetUserId,
      notificationType: 'SYSTEM',
      title: 'Account Status Updated',
      message: `Your ECOSPHERE account status is now ${isActive ? 'ACTIVE' : 'SUSPENDED'}.`,
      referenceType: 'User',
      referenceId: String(targetUserId),
    }).catch((e: any) => logger.warn('Admin user status notification error', { error: e?.message }));

    return (res.rowsAffected && res.rowsAffected[0] > 0) || false;
  },

  /**
   * DELETE /api/admin/users/:id
   * Secure account deletion with administrator protection
   */
  async deleteUser(adminUserId: number, targetUserId: number): Promise<{ success: boolean; message: string; userId: string }> {
    if (!targetUserId || isNaN(targetUserId) || targetUserId <= 0) {
      const err = new Error('Valid target user ID required');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_INPUT';
      throw err;
    }

    // 1. Protect against self-deletion
    if (adminUserId === targetUserId) {
      const err = new Error('Your own administrator account cannot be deleted.');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    // 2. Resolve target user existence from database
    const userCheck = await databaseService.query<any>(
      `SELECT TOP 1 u.UserId, u.FirstName, u.LastName, u.Email, u.Mobile, u.IsActive, u.IsBlocked
       FROM Users u WITH (NOLOCK)
       WHERE u.UserId = @targetUserId`,
      [{ name: 'targetUserId', type: mssql.BigInt(), value: targetUserId }]
    );

    if (!userCheck.recordset || userCheck.recordset.length === 0) {
      const err = new Error('User not found');
      (err as any).statusCode = 404;
      (err as any).code = 'NOT_FOUND';
      throw err;
    }

    const targetUser = userCheck.recordset[0];

    if (targetUser.IsBlocked) {
      const err = new Error('User account is already deleted.');
      (err as any).statusCode = 400;
      (err as any).code = 'ALREADY_DELETED';
      throw err;
    }

    // 3. Strict Administrator account protection
    // Check AdminUsers table
    const adminUserCheck = await databaseService.query<any>(
      `SELECT TOP 1 AdminUserId, EmployeeCode FROM AdminUsers WITH (NOLOCK) WHERE UserId = @targetUserId`,
      [{ name: 'targetUserId', type: mssql.BigInt(), value: targetUserId }]
    );

    // Check UserRoles for active administrator role
    const adminRoleCheck = await databaseService.query<any>(
      `SELECT TOP 1 ur.UserRoleId
       FROM UserRoles ur WITH (NOLOCK)
       JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
       WHERE ur.UserId = @targetUserId AND r.RoleCode = 'administrator'`,
      [{ name: 'targetUserId', type: mssql.BigInt(), value: targetUserId }]
    );

    // Check primary/configured administrator credentials
    const isPrimaryAdmin =
      targetUser.Email?.toLowerCase() === 'admin.gauresh@ecosphere.io' ||
      adminUserCheck.recordset?.[0]?.EmployeeCode === 'Admin.Gauresh';

    const isAdministrator =
      isPrimaryAdmin ||
      (adminUserCheck.recordset && adminUserCheck.recordset.length > 0) ||
      (adminRoleCheck.recordset && adminRoleCheck.recordset.length > 0);

    if (isAdministrator) {
      const err = new Error('Administrator accounts cannot be deleted from this interface.');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN';
      throw err;
    }

    // 4. Secure Soft Delete / Account Deactivation
    // Deactivates user account, marks blocked, deactivates active roles while preserving all foreign keys & transactional records
    await databaseService.query(
      `UPDATE Users 
       SET IsActive = 0, IsBlocked = 1, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE UserId = @targetUserId;

       UPDATE UserRoles 
       SET IsActive = 0 
       WHERE UserId = @targetUserId;`,
      [{ name: 'targetUserId', type: mssql.BigInt(), value: targetUserId }]
    );

    // 5. Audit Logging
    await this.logAdminAction(
      adminUserId,
      'USER_DELETED',
      'USER_MANAGEMENT',
      'USER',
      String(targetUserId),
      JSON.stringify({
        isActive: targetUser.IsActive,
        isBlocked: targetUser.IsBlocked,
      }),
      JSON.stringify({
        deletedUserId: targetUserId,
        deletedName: `${targetUser.FirstName || ''} ${targetUser.LastName || ''}`.trim(),
        deletedEmail: targetUser.Email,
        deletedMobile: targetUser.Mobile,
        deletedAt: new Date().toISOString(),
      })
    );

    // 6. Send system notification if user notification queue is active
    notificationService.createNotification({
      userId: targetUserId,
      notificationType: 'SYSTEM',
      title: 'Account Deleted',
      message: 'Your ECOSPHERE account has been deactivated and deleted by an administrator.',
      referenceType: 'User',
      referenceId: String(targetUserId),
    }).catch((e: any) => logger.warn('Admin user deletion notification error', { error: e?.message }));

    return {
      success: true,
      message: 'Account deleted successfully.',
      userId: String(targetUserId),
    };
  },

  /**
   * PUT /api/admin/businesses/:id/verify
   */
  async updateBusinessVerification(adminUserId: number, businessId: number, status: string): Promise<boolean> {
    const validStatuses = ['VERIFIED', 'PENDING', 'REJECTED'];
    const normStatus = status.toUpperCase();
    if (!validStatuses.includes(normStatus)) {
      throw new Error('INVALID_STATUS: Verification status must be VERIFIED, PENDING, or REJECTED');
    }

    const res = await databaseService.query<any>(
      `UPDATE Businesses SET VerificationStatus = @normStatus, UpdatedAt = GETDATE() WHERE BusinessId = @businessId`,
      [
        { name: 'normStatus', type: mssql.NVarChar(50), value: normStatus },
        { name: 'businessId', type: mssql.BigInt(), value: businessId },
      ]
    );

    await this.logAdminAction(
      adminUserId,
      'BUSINESS_VERIFICATION_UPDATED',
      'BUSINESS_MODERATION',
      'BUSINESS',
      String(businessId),
      undefined,
      JSON.stringify({ verificationStatus: normStatus })
    );

    // Notify business owner
    const bizOwnerRes = await databaseService.query<any>(
      'SELECT OwnerUserId, BusinessName FROM Businesses WHERE BusinessId = @bId',
      [{ name: 'bId', type: mssql.BigInt(), value: businessId }]
    );
    if (bizOwnerRes.recordset?.[0]?.OwnerUserId) {
      notificationService.createNotification({
        userId: Number(bizOwnerRes.recordset[0].OwnerUserId),
        notificationType: 'BUSINESS_UPDATE',
        title: 'Business Verification Updated',
        message: `Your business "${bizOwnerRes.recordset[0].BusinessName || 'Business'}" verification status is now ${normStatus}.`,
        referenceType: 'Business',
        referenceId: String(businessId),
      }).catch((e: any) => logger.warn('Admin business verification notification error', { error: e?.message }));
    }

    return (res.rowsAffected && res.rowsAffected[0] > 0) || false;
  },

  /**
   * GET /api/admin/audit-logs
   */
  async getAuditLogs(limit = 20): Promise<any[]> {
    const res = await databaseService.query<any>(
      `SELECT TOP (@limit) AuditLogId, UserId, ActionType, ModuleName, EntityType, EntityId, OldValues, NewValues, CreatedAt
       FROM AuditLogs WITH (NOLOCK)
       ORDER BY AuditLogId DESC`,
      [{ name: 'limit', type: mssql.Int(), value: limit }]
    );

    return (res.recordset || []).map((r: any) => ({
      id: String(r.AuditLogId),
      adminUserId: String(r.UserId),
      actionType: r.ActionType || '',
      moduleName: r.ModuleName || '',
      entityType: r.EntityType || '',
      entityId: r.EntityId || '',
      createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
    }));
  },

  /**
   * GET /api/admin/seller-access-requests
   * List all seller capability requests from customers
   */
  async getSellerAccessRequests(statusFilter?: string): Promise<any[]> {
    let whereClause = "WHERE vr.VerificationType = 'SellerAccess'";
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      whereClause += ' AND vr.Status = @status';
      params.push({ name: 'status', type: mssql.VarChar(50), value: statusFilter.toUpperCase() });
    }

    const res = await databaseService.query<any>(
      `SELECT 
         vr.VerificationRequestId AS id,
         vr.UserId AS userId,
         vr.Status AS status,
         vr.VerificationType AS verificationType,
         vr.DocumentReference AS notes,
         vr.SubmittedAt AS submittedAt,
         vr.ReviewedAt AS reviewedAt,
         vr.ReviewedByUserId AS reviewedByUserId,
         vr.RejectionReason AS rejectionReason,
         vr.CreatedAt AS createdAt,
         u.FirstName, u.LastName, u.Email, u.Mobile
       FROM VerificationRequests vr WITH (NOLOCK)
       JOIN Users u WITH (NOLOCK) ON vr.UserId = u.UserId
       ${whereClause}
       ORDER BY vr.VerificationRequestId DESC`,
      params
    );

    return (res.recordset || []).map((r: any) => ({
      id: String(r.id),
      requestId: String(r.id),
      userId: String(r.userId),
      name: `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE User',
      applicantName: `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE User',
      email: r.Email || '',
      mobile: r.Mobile || '',
      status: r.status,
      notes: r.notes || '',
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : new Date().toISOString(),
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
      rejectionReason: r.rejectionReason || undefined,
    }));
  },

  /**
   * PUT /api/admin/seller-access-requests/:id/approve
   * Persistently grants seller capability to customer
   */
  async approveSellerAccessRequest(adminUserId: number, requestId: number): Promise<boolean> {
    const reqRes = await databaseService.query<any>(
      `SELECT TOP 1 VerificationRequestId, UserId, Status 
       FROM VerificationRequests WITH (NOLOCK)
       WHERE VerificationRequestId = @reqId AND VerificationType = 'SellerAccess'`,
      [{ name: 'reqId', type: mssql.BigInt(), value: requestId }]
    );

    if (!reqRes.recordset || reqRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Seller access request not found');
    }

    const targetUserId = Number(reqRes.recordset[0].UserId);

    // 1. Update VerificationRequests status to APPROVED
    await databaseService.query(
      `UPDATE VerificationRequests 
       SET Status = 'APPROVED', ReviewedByUserId = @adminId, ReviewedAt = CURRENT_TIMESTAMP, UpdatedAt = CURRENT_TIMESTAMP
       WHERE VerificationRequestId = @reqId`,
      [
        { name: 'adminId', type: mssql.BigInt(), value: adminUserId },
        { name: 'reqId', type: mssql.BigInt(), value: requestId },
      ]
    );

    // 2. Persistently activate/grant Seller role (RoleId: 2) in UserRoles
    const roleCheck = await databaseService.query<any>(
      `SELECT UserRoleId FROM UserRoles WHERE UserId = @userId AND RoleId = 2`,
      [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
    );

    if (roleCheck.recordset && roleCheck.recordset.length > 0) {
      await databaseService.query(
        `UPDATE UserRoles SET IsActive = 1 WHERE UserId = @userId AND RoleId = 2`,
        [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
      );
    } else {
      await databaseService.query(
        `INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt)
         VALUES (@userId, 2, 0, 1, CURRENT_TIMESTAMP)`,
        [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
      );
    }

    // 3. Notify the approved customer
    notificationService.createNotification({
      userId: targetUserId,
      notificationType: 'SYSTEM',
      title: 'Seller Access Approved! 🎉',
      message: 'Your seller access request has been approved. You can now switch to Seller mode and manage your businesses.',
      referenceType: 'User',
      referenceId: String(targetUserId),
    }).catch((e: any) => logger.warn('Seller approval notification warning', { error: e?.message }));

    // 4. Log admin audit action
    await this.logAdminAction(
      adminUserId,
      'SELLER_ACCESS_APPROVED',
      'USER_MANAGEMENT',
      'USER',
      String(targetUserId),
      undefined,
      JSON.stringify({ requestId, approved: true })
    );

    logger.info('Seller access request approved', { adminUserId, targetUserId, requestId });
    return true;
  },

  /**
   * PUT /api/admin/seller-access-requests/:id/reject
   */
  async rejectSellerAccessRequest(adminUserId: number, requestId: number, reason?: string): Promise<boolean> {
    const reqRes = await databaseService.query<any>(
      `SELECT TOP 1 VerificationRequestId, UserId, Status 
       FROM VerificationRequests WITH (NOLOCK)
       WHERE VerificationRequestId = @reqId AND VerificationType = 'SellerAccess'`,
      [{ name: 'reqId', type: mssql.BigInt(), value: requestId }]
    );

    if (!reqRes.recordset || reqRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Seller access request not found');
    }

    const targetUserId = Number(reqRes.recordset[0].UserId);
    const rejectionReason = reason?.trim() || 'Request did not meet platform verification guidelines.';

    // 1. Update VerificationRequests status to REJECTED
    await databaseService.query(
      `UPDATE VerificationRequests 
       SET Status = 'REJECTED', ReviewedByUserId = @adminId, ReviewedAt = CURRENT_TIMESTAMP, 
           RejectionReason = @reason, UpdatedAt = CURRENT_TIMESTAMP
       WHERE VerificationRequestId = @reqId`,
      [
        { name: 'adminId', type: mssql.BigInt(), value: adminUserId },
        { name: 'reason', type: mssql.NVarChar(500), value: rejectionReason },
        { name: 'reqId', type: mssql.BigInt(), value: requestId },
      ]
    );

    // 2. Ensure seller role is inactive in UserRoles
    await databaseService.query(
      `UPDATE UserRoles SET IsActive = 0 WHERE UserId = @userId AND RoleId = 2`,
      [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
    );

    // 3. Notify user
    notificationService.createNotification({
      userId: targetUserId,
      notificationType: 'SYSTEM',
      title: 'Seller Access Update',
      message: `Your seller access request was not approved: ${rejectionReason}`,
      referenceType: 'User',
      referenceId: String(targetUserId),
    }).catch((e: any) => logger.warn('Seller rejection notification warning', { error: e?.message }));

    // 4. Log admin audit action
    await this.logAdminAction(
      adminUserId,
      'SELLER_ACCESS_REJECTED',
      'USER_MANAGEMENT',
      'USER',
      String(targetUserId),
      undefined,
      JSON.stringify({ requestId, rejected: true, reason: rejectionReason })
    );

    logger.info('Seller access request rejected', { adminUserId, targetUserId, requestId, rejectionReason });
    return true;
  },

  /**
   * Revoke seller capability from a user
   */
  async revokeSellerAccess(adminUserId: number, targetUserId: number): Promise<boolean> {
    // 1. Deactivate seller role in UserRoles
    await databaseService.query(
      `UPDATE UserRoles SET IsActive = 0, IsPrimaryRole = 0 WHERE UserId = @userId AND RoleId = 2;
       UPDATE UserRoles SET IsPrimaryRole = 1, IsActive = 1 WHERE UserId = @userId AND RoleId = 1;`,
      [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
    );

    // 2. Update VerificationRequests to REVOKED
    await databaseService.query(
      `UPDATE VerificationRequests 
       SET Status = 'REVOKED', UpdatedAt = CURRENT_TIMESTAMP
       WHERE UserId = @userId AND VerificationType = 'SellerAccess'`,
      [{ name: 'userId', type: mssql.BigInt(), value: targetUserId }]
    );

    // 3. Notify user
    notificationService.createNotification({
      userId: targetUserId,
      notificationType: 'SYSTEM',
      title: 'Seller Access Revoked',
      message: 'Your seller capability has been revoked by an administrator. Your account has returned to customer mode.',
      referenceType: 'User',
      referenceId: String(targetUserId),
    }).catch((e: any) => logger.warn('Seller revoke notification warning', { error: e?.message }));

    // 4. Log admin audit action
    await this.logAdminAction(
      adminUserId,
      'SELLER_ACCESS_REVOKED',
      'USER_MANAGEMENT',
      'USER',
      String(targetUserId),
      undefined,
      JSON.stringify({ revoked: true })
    );

    return true;
  },
};
