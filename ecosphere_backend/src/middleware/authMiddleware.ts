import { Response, NextFunction } from 'express';
import mssql from 'mssql';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { databaseService } from '../services/databaseService.js';

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication token is required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch {
    return sendError(res, 'INVALID_TOKEN', 'Authentication token is invalid or expired', 401);
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    // Server-side authorization check: allow approved seller-capable users for seller endpoints
    if (roles.includes('seller') && req.user.userId) {
      try {
        const numericUserId = parseInt(req.user.userId, 10);
        if (!isNaN(numericUserId) && numericUserId > 0) {
          const capCheck = await databaseService.query<any>(
            `SELECT 1 FROM UserRoles WITH (NOLOCK) 
             WHERE UserId = @uid AND RoleId IN (2, 3) AND IsActive = 1
             UNION
             SELECT 1 FROM VerificationRequests WITH (NOLOCK)
             WHERE UserId = @uid AND VerificationType = 'SellerAccess' AND Status = 'APPROVED'`,
            [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
          );
          if (capCheck.recordset && capCheck.recordset.length > 0) {
            return next();
          }
        }
      } catch {
        // fallback to standard check
      }
    }

    return sendError(
      res,
      'FORBIDDEN',
      `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
      403
    );
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      req.user = payload;
    } catch {
      // Ignore invalid token in optionalAuth
    }
  }
  return next();
}
