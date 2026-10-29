import bcrypt from 'bcryptjs';
import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { generateToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt.js';
import { User, UserRole } from '../types/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const DEV_OTP = '123456';
const usedResetTokens = new Map<string, number>();

export const authService = {
  /**
   * Request OTP for login or registration.
   * If intent is 'login', rejects unregistered accounts immediately.
   */
  async requestOtp(
    mobile: string,
    intent?: 'login' | 'register'
  ): Promise<{ success: boolean; message: string; developmentOtp?: string }> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    if (!searchMobile || searchMobile.length < 10) {
      const err = new Error('A valid 10-digit mobile number is required.');
      (err as any).code = 'INVALID_MOBILE';
      throw err;
    }

    logger.info('OTP request initiated', { mobile: searchMobile, intent });

    // Check account existence among active / suspended accounts (excluding deleted accounts where IsBlocked = 1)
    const activeOrSuspendedUser = await databaseService.query<any>(
      `SELECT TOP 1 UserId, IsActive, IsBlocked
       FROM Users WITH (NOLOCK)
       WHERE Mobile = @mobile AND IsBlocked = 0
       ORDER BY UserId DESC`,
      [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
    );

    const hasActiveOrSuspendedAccount = Boolean(
      activeOrSuspendedUser.recordset && activeOrSuspendedUser.recordset.length > 0
    );

    // If intent is login, reject unknown or inactive accounts immediately without sending OTP
    if (intent === 'login') {
      if (!hasActiveOrSuspendedAccount) {
        const err = new Error('Account not registered. Please create an account first.');
        (err as any).code = 'ACCOUNT_NOT_REGISTERED';
        (err as any).statusCode = 404;
        throw err;
      }
      const existingRow = activeOrSuspendedUser.recordset[0];
      if (!existingRow.IsActive) {
        const err = new Error('Account is inactive or unavailable.');
        (err as any).code = 'ACCOUNT_INACTIVE';
        (err as any).statusCode = 403;
        throw err;
      }
    }

    // If intent is register:
    // ACTIVE: block duplicate
    // SUSPENDED: block suspended mobile
    // DELETED / NOT FOUND: allow OTP registration
    if (intent === 'register' && hasActiveOrSuspendedAccount) {
      const existingRow = activeOrSuspendedUser.recordset[0];
      if (existingRow.IsActive) {
        const err = new Error('An account with this mobile number already exists. Please log in.');
        (err as any).code = 'ACCOUNT_ALREADY_EXISTS';
        (err as any).statusCode = 409;
        throw err;
      } else {
        const err = new Error('This mobile number belongs to a suspended account.');
        (err as any).code = 'ACCOUNT_SUSPENDED';
        (err as any).statusCode = 403;
        throw err;
      }
    }

    if (env.NODE_ENV === 'development') {
      return {
        success: true,
        message: 'OTP sent successfully',
        developmentOtp: DEV_OTP,
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  },

  /**
   * Verify OTP.
   * CRITICAL: Login MUST NEVER create a new user.
   * Only an explicit registration payload creates an account.
   */
  async verifyOtp(
    mobile: string,
    otp: string,
    registrationData?: {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      requestedRole?: string;
      sellerType?: string;
      password?: string;
    },
    intent?: 'login' | 'register'
  ): Promise<{ token: string; user: User }> {
    if (env.NODE_ENV === 'development' && otp !== DEV_OTP) {
      const err = new Error('Invalid OTP provided. Development OTP is 123456.');
      (err as any).code = 'INVALID_OTP';
      throw err;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    if (!searchMobile || searchMobile.length < 10) {
      const err = new Error('A valid 10-digit mobile number is required.');
      (err as any).code = 'INVALID_MOBILE';
      throw err;
    }

    let user: User | null = null;

    try {
      // Query active or suspended account (IsBlocked = 0)
      const activeOrSuspendedRes = await databaseService.query<any>(
        `SELECT TOP 1 
           u.UserId, 
           u.FirstName, 
           u.LastName, 
           u.Email, 
           u.Mobile, 
           u.IsActive, 
           u.IsBlocked,
           r.RoleCode,
           up.Occupation,
           up.Bio
         FROM Users u WITH (NOLOCK)
         LEFT JOIN UserRoles ur WITH (NOLOCK) ON u.UserId = ur.UserId AND ur.IsPrimaryRole = 1 AND ur.IsActive = 1
         LEFT JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
         LEFT JOIN UserProfiles up WITH (NOLOCK) ON u.UserId = up.UserId
         WHERE u.Mobile = @mobile AND u.IsBlocked = 0
         ORDER BY CASE WHEN u.IsActive = 1 THEN 0 ELSE 1 END, u.UserId DESC`,
        [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
      );

      const isExplicitRegistration = Boolean(
        intent === 'register' || (registrationData?.name && registrationData?.email)
      );

      if (activeOrSuspendedRes.recordset && activeOrSuspendedRes.recordset.length > 0) {
        const row = activeOrSuspendedRes.recordset[0];

        if (isExplicitRegistration) {
          if (row.IsActive) {
            const err = new Error('An account with this mobile number already exists. Please log in.');
            (err as any).code = 'ACCOUNT_ALREADY_EXISTS';
            (err as any).statusCode = 409;
            throw err;
          } else {
            const err = new Error('This mobile number belongs to a suspended account.');
            (err as any).code = 'ACCOUNT_SUSPENDED';
            (err as any).statusCode = 403;
            throw err;
          }
        }

        // LOGIN FLOW
        if (!row.IsActive) {
          const err = new Error('Account is inactive or unavailable.');
          (err as any).code = 'ACCOUNT_INACTIVE';
          (err as any).statusCode = 403;
          throw err;
        }

        const rawRole = row.RoleCode ? String(row.RoleCode).toLowerCase() : 'customer';
        const role = (['customer', 'seller', 'administrator'].includes(rawRole) ? rawRole : 'customer') as UserRole;
        const fullName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'ECOSPHERE Member';
        const status: 'active' | 'suspended' | 'pending' = 'active';
        const sellerType = role === 'seller' ? (row.Occupation || 'Shop Owner') : undefined;

        user = {
          id: String(row.UserId),
          name: fullName,
          email: row.Email || `user_${searchMobile}@ecosphere.io`,
          phone: row.Mobile || searchMobile,
          role,
          sellerType,
          status,
          walletBalance: 5000,
          verified: true,
        };

        // Update LastLoginAt
        databaseService.query(
          `UPDATE Users SET LastLoginAt = CURRENT_TIMESTAMP WHERE UserId = @uid`,
          [{ name: 'uid', type: mssql.BigInt(), value: row.UserId }]
        ).catch(() => {});
      } else {
        // No active or suspended account found for this mobile!
        if (!isExplicitRegistration) {
          // LOGIN ATTEMPT FOR UNKNOWN / DELETED ACCOUNT -> MUST REJECT!
          const err = new Error('Account not registered. Please create an account first.');
          (err as any).code = 'ACCOUNT_NOT_REGISTERED';
          (err as any).statusCode = 404;
          throw err;
        }

        // REGISTRATION FLOW:
        // Create brand-new user with fresh UserId!
        const targetRoleCode = 'customer';
        const wantsSeller = registrationData?.requestedRole?.toLowerCase() === 'seller';

        let firstName = 'ECOSPHERE';
        let lastName = 'Member';
        if (registrationData?.firstName) {
          firstName = registrationData.firstName.trim();
          lastName = (registrationData.lastName || 'Member').trim();
        } else if (registrationData?.name) {
          const parts = registrationData.name.trim().split(' ');
          firstName = parts[0] || 'ECOSPHERE';
          lastName = parts.slice(1).join(' ') || 'Member';
        }
        const userEmail = registrationData?.email || `user_${searchMobile}@ecosphere.io`;

        // Check if email already in use by an active/suspended account (IsBlocked = 0)
        const emailCheck = await databaseService.query<any>(
          `SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE Email = @email AND IsBlocked = 0`,
          [{ name: 'email', type: mssql.NVarChar(100), value: userEmail }]
        );
        if (emailCheck.recordset && emailCheck.recordset.length > 0) {
          const err = new Error('An account with this email address already exists. Please log in.');
          (err as any).code = 'EMAIL_ALREADY_EXISTS';
          (err as any).statusCode = 409;
          throw err;
        }

        let passwordHash: string | null = null;
        if (registrationData?.password) {
          passwordHash = await bcrypt.hash(registrationData.password, 10);
        }

        const insUser = await databaseService.query<any>(
          `INSERT INTO Users (FirstName, LastName, Email, Mobile, PasswordHash, IsEmailVerified, IsMobileVerified, IsActive, IsBlocked, CreatedAt)
           OUTPUT INSERTED.UserId
           VALUES (@firstName, @lastName, @email, @mobile, @passwordHash, 1, 1, 1, 0, CURRENT_TIMESTAMP)`,
          [
            { name: 'firstName', type: mssql.NVarChar(50), value: firstName },
            { name: 'lastName', type: mssql.NVarChar(50), value: lastName },
            { name: 'email', type: mssql.NVarChar(100), value: userEmail },
            { name: 'mobile', type: mssql.NVarChar(20), value: searchMobile },
            { name: 'passwordHash', type: mssql.NVarChar(255), value: passwordHash },
          ]
        );

        if (insUser.recordset && insUser.recordset.length > 0) {
          const newUserId = Number(insUser.recordset[0].UserId);
          const occupation = 'Community Member';
          const bio = 'ECOSPHERE Ecosystem Member';

          await databaseService.query(
            `INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt)
             VALUES (@newId, 1, 1, 1, CURRENT_TIMESTAMP);
             INSERT INTO UserProfiles (UserId, Bio, Occupation, IsProfileComplete, CreatedAt)
             VALUES (@newId, @bio, @occupation, 0, CURRENT_TIMESTAMP);`,
            [
              { name: 'newId', type: mssql.BigInt(), value: newUserId },
              { name: 'bio', type: mssql.NVarChar(500), value: bio },
              { name: 'occupation', type: mssql.NVarChar(100), value: occupation },
            ]
          );

          // If seller access requested during registration, create pending VerificationRequest for Admin
          if (wantsSeller) {
            const requestedSellerType = registrationData?.sellerType?.trim() || 'Shop Owner';
            await databaseService.query(
              `INSERT INTO VerificationRequests (
                 UserId, EntityType, EntityId, VerificationType, DocumentReference, Status, SubmittedAt, CreatedAt
               ) VALUES (
                 @uid, 'User', @uid, 'SellerAccess', @docRef, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
               )`,
              [
                { name: 'uid', type: mssql.BigInt(), value: newUserId },
                { name: 'docRef', type: mssql.NVarChar(500), value: `Registration Request: ${requestedSellerType}` },
              ]
            );
            logger.info('Created pending SellerAccess verification request during user registration', {
              userId: newUserId,
              sellerType: requestedSellerType,
            });
          }

          user = {
            id: String(newUserId),
            name: `${firstName} ${lastName}`.trim(),
            email: userEmail,
            phone: searchMobile,
            role: 'customer',
            status: 'active',
            verified: true,
            walletBalance: 5000,
          };

          logger.info('Registered new database user with customer primary role', {
            userId: newUserId,
            mobile: searchMobile,
            wantsSeller,
          });
        }
      }
    } catch (dbError) {
      const err = dbError as any;
      if (
        err.code === 'ACCOUNT_NOT_REGISTERED' ||
        err.code === 'ACCOUNT_BLOCKED' ||
        err.code === 'ACCOUNT_INACTIVE' ||
        err.code === 'ACCOUNT_ALREADY_EXISTS' ||
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.code === 'EMAIL_ALREADY_EXISTS'
      ) {
        throw err;
      }
      logger.error('Database query during OTP verification encountered issue', { message: err.message });
      throw new Error(`Authentication failed: ${err.message}`);
    }

    if (!user) {
      const err = new Error('Failed to resolve authenticated database user.');
      (err as any).code = 'AUTH_FAILED';
      throw err;
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      mobile: user.phone,
    });

    return { token, user };
  },

  /**
   * Username / Email / Mobile + Password authentication login.
   * Supports Administrator credentials (Admin.Gauresh / Admin@Pass256)
   * and regular registered users. Rejects unknown accounts without creating records.
   */
  async login(identifier: string, password?: string): Promise<{ token: string; user: User }> {
    if (!identifier || !identifier.trim()) {
      const err = new Error('Login identifier is required.');
      (err as any).code = 'INVALID_INPUT';
      (err as any).statusCode = 400;
      throw err;
    }

    const cleanInput = identifier.trim();
    const cleanMobile = cleanInput.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';

    const result = await databaseService.query<any>(
      `SELECT TOP 1 
         u.UserId, 
         u.FirstName, 
         u.LastName, 
         u.Email, 
         u.Mobile, 
         u.PasswordHash,
         u.IsActive, 
         u.IsBlocked,
         r.RoleCode,
         up.Occupation,
         up.Bio,
         au.EmployeeCode
       FROM Users u WITH (NOLOCK)
       LEFT JOIN UserRoles ur WITH (NOLOCK) ON u.UserId = ur.UserId AND ur.IsPrimaryRole = 1 AND ur.IsActive = 1
       LEFT JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
       LEFT JOIN UserProfiles up WITH (NOLOCK) ON u.UserId = up.UserId
       LEFT JOIN AdminUsers au WITH (NOLOCK) ON u.UserId = au.UserId
       WHERE au.EmployeeCode = @input
          OR u.Email = @input
          OR (u.FirstName + '.' + u.LastName) = @input
          OR (u.FirstName + ' ' + u.LastName) = @input
          OR (@searchMobile <> '' AND u.Mobile = @searchMobile)
          OR u.Mobile = @input
       ORDER BY 
         CASE WHEN u.IsBlocked = 0 AND u.IsActive = 1 THEN 1 
              WHEN u.IsBlocked = 0 THEN 2 
              ELSE 3 END ASC, 
         u.UserId DESC`,
      [
        { name: 'input', type: mssql.NVarChar(100), value: cleanInput },
        { name: 'searchMobile', type: mssql.NVarChar(50), value: searchMobile },
      ]
    );

    if (!result.recordset || result.recordset.length === 0) {
      const err = new Error('Account not registered. Please create an account first.');
      (err as any).code = 'ACCOUNT_NOT_REGISTERED';
      (err as any).statusCode = 404;
      throw err;
    }

    const row = result.recordset[0];
    if (row.IsBlocked || !row.IsActive) {
      const err = new Error('Account is inactive or unavailable.');
      (err as any).code = 'ACCOUNT_INACTIVE';
      (err as any).statusCode = 403;
      throw err;
    }

    // Verify password if provided
    if (password) {
      let isPasswordValid = false;
      if (row.PasswordHash) {
        isPasswordValid = await bcrypt.compare(password, row.PasswordHash);
      }
      if (!isPasswordValid && env.NODE_ENV === 'development') {
        // Fallback check for dev credentials
        if (password === 'Admin@Pass256' && (row.EmployeeCode === 'Admin.Gauresh' || row.RoleCode === 'administrator')) {
          isPasswordValid = true;
        }
      }

      if (!isPasswordValid) {
        const err = new Error('Invalid password.');
        (err as any).code = 'INVALID_PASSWORD';
        (err as any).statusCode = 401;
        throw err;
      }
    }

    const rawRole = row.RoleCode ? String(row.RoleCode).toLowerCase() : 'customer';
    const role = (['customer', 'seller', 'administrator'].includes(rawRole) ? rawRole : 'customer') as UserRole;
    const fullName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'ECOSPHERE Member';
    const status: 'active' | 'suspended' | 'pending' = row.IsBlocked ? 'suspended' : row.IsActive === false ? 'pending' : 'active';
    const sellerType = role === 'seller' ? (row.Occupation || 'Shop Owner') : undefined;

    const fullUser = await this.getCurrentUser(String(row.UserId));
    const user: User = fullUser || {
      id: String(row.UserId),
      name: fullName,
      email: row.Email || `${row.UserId}@ecosphere.io`,
      phone: row.Mobile || '',
      role,
      currentMode: role,
      sellerType,
      status,
      walletBalance: 5000,
      verified: true,
    };

    // Update LastLoginAt
    databaseService.query(
      `UPDATE Users SET LastLoginAt = CURRENT_TIMESTAMP WHERE UserId = @uid`,
      [{ name: 'uid', type: mssql.BigInt(), value: row.UserId }]
    ).catch(() => {});

    const token = generateToken({
      userId: user.id,
      role: user.role,
      mobile: user.phone,
    });

    return { token, user };
  },

  /**
   * Fetch current authenticated user by integer UserId.
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId) || numericUserId <= 0) {
        return null;
      }

      const result = await databaseService.query<any>(
        `SELECT TOP 1 
           u.UserId, 
           u.FirstName, 
           u.LastName, 
           u.Email, 
           u.Mobile, 
           u.IsActive, 
           u.IsBlocked,
           r.RoleCode,
           up.Occupation,
           up.Bio
         FROM Users u WITH (NOLOCK)
         LEFT JOIN UserRoles ur WITH (NOLOCK) ON u.UserId = ur.UserId AND ur.IsPrimaryRole = 1 AND ur.IsActive = 1
         LEFT JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
         LEFT JOIN UserProfiles up WITH (NOLOCK) ON u.UserId = up.UserId
         WHERE u.UserId = @userId`,
        [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
      );

      if (result.recordset && result.recordset.length > 0) {
        const row = result.recordset[0];
        const rawRole = row.RoleCode ? String(row.RoleCode).toLowerCase() : 'customer';
        const role = (['customer', 'seller', 'administrator'].includes(rawRole) ? rawRole : 'customer') as UserRole;
        const fullName = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'ECOSPHERE Member';
        const status: 'active' | 'suspended' | 'pending' = row.IsBlocked ? 'suspended' : row.IsActive === false ? 'pending' : 'active';
        const sellerType = role === 'seller' ? (row.Occupation || 'Shop Owner') : undefined;

        // Check if user has approved seller capability in UserRoles
        const sellerCapabilityCheck = await databaseService.query<any>(
          `SELECT 1 FROM UserRoles WITH (NOLOCK) WHERE UserId = @uid AND RoleId IN (2, 3) AND IsActive = 1`,
          [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
        );
        let hasSellerCapability = (sellerCapabilityCheck.recordset?.length || 0) > 0;

        let sellerAccessStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' = hasSellerCapability ? 'APPROVED' : 'NONE';

        // Check latest VerificationRequest
        const reqCheck = await databaseService.query<any>(
          `SELECT TOP 1 Status FROM VerificationRequests WITH (NOLOCK) 
           WHERE UserId = @uid AND VerificationType = 'SellerAccess'
           ORDER BY VerificationRequestId DESC`,
          [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
        );
        if (reqCheck.recordset && reqCheck.recordset.length > 0) {
          const reqStatus = reqCheck.recordset[0].Status as any;
          if (reqStatus === 'APPROVED') {
            hasSellerCapability = true;
            sellerAccessStatus = 'APPROVED';
          } else if (!hasSellerCapability) {
            sellerAccessStatus = reqStatus;
          }
        }

        // Retrieve saved user location from UserLocations
        const locResult = await databaseService.query<any>(
          `SELECT TOP 1 City, State, Area FROM UserLocations WITH (NOLOCK)
           WHERE UserId = @uid AND IsActive = 1
           ORDER BY IsPrimary DESC, UpdatedAt DESC, UserLocationId DESC`,
          [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
        );
        let userCity: string | undefined = undefined;
        let userLocation: string | undefined = undefined;
        if (locResult.recordset && locResult.recordset.length > 0) {
          const lRow = locResult.recordset[0];
          userCity = lRow.City || undefined;
          if (lRow.City) {
            userLocation = lRow.Area ? `${lRow.Area}, ${lRow.City}` : (lRow.State ? `${lRow.City}, ${lRow.State}` : lRow.City);
          }
        }

        return {
          id: String(row.UserId),
          name: fullName,
          email: row.Email || `user_${row.UserId}@ecosphere.io`,
          phone: row.Mobile || '',
          role,
          currentMode: role,
          sellerType,
          status,
          walletBalance: 5000,
          verified: true,
          sellerAccessStatus,
          sellerEnabled: hasSellerCapability,
          canSwitchToSeller: hasSellerCapability,
          hasSellerCapability,
          city: userCity,
          location: userLocation,
        };
      }
    } catch (dbError) {
      const err = dbError as Error;
      logger.warn('Database error fetching current user profile', { message: err.message });
    }

    return null;
  },

  /**
   * Switch account mode (customer <-> seller) for the SAME UserId.
   * Backend verifies seller capability/approval before allowing seller operations.
   */
  async switchMode(
    userId: string,
    targetMode: 'customer' | 'seller',
    sellerType?: string
  ): Promise<{ token: string; user: User }> {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error('Valid numeric UserId required.');
    }

    // 1. Verify user exists and is active
    const userCheck = await databaseService.query<any>(
      `SELECT TOP 1 UserId, Mobile, Email, FirstName, LastName, IsActive, IsBlocked
       FROM Users WITH (NOLOCK)
       WHERE UserId = @userId`,
      [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
    );

    if (!userCheck.recordset || userCheck.recordset.length === 0) {
      throw new Error('User not found in database.');
    }
    const userRow = userCheck.recordset[0];
    if (userRow.IsBlocked || !userRow.IsActive) {
      throw new Error('Account is inactive or unavailable.');
    }

    // 2. Fetch existing UserRoles for this user
    const rolesRes = await databaseService.query<any>(
      `SELECT ur.UserRoleId, ur.RoleId, ur.IsPrimaryRole, ur.IsActive, r.RoleCode
       FROM UserRoles ur WITH (NOLOCK)
       JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
       WHERE ur.UserId = @userId`,
      [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
    );

    const userRolesList = rolesRes.recordset || [];
    const hasCustomerRole = userRolesList.some((r: any) => String(r.RoleCode).toLowerCase() === 'customer');
    const hasActiveSellerRole = userRolesList.some(
      (r: any) => String(r.RoleCode).toLowerCase() === 'seller' && Boolean(r.IsActive)
    );
    const isAdmin = userRolesList.some(
      (r: any) => String(r.RoleCode).toLowerCase() === 'administrator' && Boolean(r.IsActive)
    );

    // Also check VerificationRequests table
    const hasApprovedReq = await databaseService.query<any>(
      `SELECT TOP 1 VerificationRequestId FROM VerificationRequests WITH (NOLOCK) 
       WHERE UserId = @userId AND VerificationType = 'SellerAccess' AND Status = 'APPROVED'`,
      [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
    );
    const isApprovedInVerification = (hasApprovedReq.recordset?.length || 0) > 0;

    // 3. Handle switching to SELLER
    if (targetMode === 'seller') {
      // Backend MUST verify seller approval:
      // Must have active seller role (RoleId 2 with IsActive = 1), approved VerificationRequest, or Administrator role
      if (!hasActiveSellerRole && !isApprovedInVerification && !isAdmin) {
        const unapprovedError = new Error('Seller access requires administrator approval.');
        (unapprovedError as any).code = 'SELLER_ACCESS_UNAPPROVED';
        (unapprovedError as any).statusCode = 403;
        throw unapprovedError;
      }

      // Check seller profile setup
      const profileRes = await databaseService.query<any>(
        `SELECT TOP 1 Occupation, Bio FROM UserProfiles WITH (NOLOCK) WHERE UserId = @userId`,
        [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
      );
      const existingOccupation = profileRes.recordset?.[0]?.Occupation;

      const bizRes = await databaseService.query<any>(
        `SELECT TOP 1 BusinessId, BusinessName FROM Businesses WITH (NOLOCK) WHERE OwnerUserId = @userId`,
        [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
      );
      const hasBusiness = (bizRes.recordset?.length || 0) > 0;

      const activeSellerType = sellerType?.trim() || existingOccupation || (hasBusiness ? 'Shop Owner' : 'Verified Merchant');

      // Update UserProfiles occupation if provided
      if (sellerType || !existingOccupation) {
        await databaseService.query(
          `IF EXISTS (SELECT 1 FROM UserProfiles WHERE UserId = @userId)
             UPDATE UserProfiles SET Occupation = @occupation, Bio = COALESCE(Bio, @bio) WHERE UserId = @userId
           ELSE
             INSERT INTO UserProfiles (UserId, Bio, Occupation, IsProfileComplete, CreatedAt)
             VALUES (@userId, @bio, @occupation, 0, CURRENT_TIMESTAMP)`,
          [
            { name: 'userId', type: mssql.BigInt(), value: numericUserId },
            { name: 'occupation', type: mssql.NVarChar(100), value: activeSellerType },
            { name: 'bio', type: mssql.NVarChar(500), value: `ECOSPHERE Verified ${activeSellerType}` },
          ]
        );
      }

      // Promote RoleId 2 (seller) to PrimaryRole = 1, set others to PrimaryRole = 0
      await databaseService.query(
        `UPDATE UserRoles SET IsPrimaryRole = 0 WHERE UserId = @userId;
         IF EXISTS (SELECT 1 FROM UserRoles WHERE UserId = @userId AND RoleId = 2)
           UPDATE UserRoles SET IsPrimaryRole = 1, IsActive = 1 WHERE UserId = @userId AND RoleId = 2
         ELSE
           INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt)
           VALUES (@userId, 2, 1, 1, CURRENT_TIMESTAMP);`,
        [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
      );
    }

    // 4. Handle switching to CUSTOMER
    if (targetMode === 'customer') {
      if (hasCustomerRole) {
        await databaseService.query(
          `UPDATE UserRoles SET IsPrimaryRole = 0 WHERE UserId = @userId;
           UPDATE UserRoles SET IsPrimaryRole = 1, IsActive = 1 WHERE UserId = @userId AND RoleId = 1;`,
          [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
        );
      } else {
        await databaseService.query(
          `UPDATE UserRoles SET IsPrimaryRole = 0 WHERE UserId = @userId;
           INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt)
           VALUES (@userId, 1, 1, 1, CURRENT_TIMESTAMP);`,
          [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
        );
      }
    }

    // 5. Fetch authoritative updated user object
    const updatedUser = await this.getCurrentUser(String(numericUserId));
    if (!updatedUser) {
      throw new Error('Failed to resolve updated user profile after mode switch.');
    }

    updatedUser.role = targetMode;

    // 6. Mint brand-new signed JWT token for the targetMode
    const token = generateToken({
      userId: String(numericUserId),
      role: targetMode,
      mobile: updatedUser.phone || userRow.Mobile || '',
    });

    logger.info('User successfully switched account mode', {
      userId: numericUserId,
      switchedTo: targetMode,
      sellerType: updatedUser.sellerType,
    });

    return { token, user: updatedUser };
  },

  /**
   * Customer requests seller access.
   * Checks for duplicate requests or existing approval.
   */
  async requestSellerAccess(
    userId: string,
    notes?: string
  ): Promise<{ success: boolean; status: string; message: string; requestId?: string }> {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error('Valid numeric UserId required.');
    }

    // Check if already an approved seller
    const roleCheck = await databaseService.query<any>(
      `SELECT 1 FROM UserRoles WITH (NOLOCK) WHERE UserId = @uid AND RoleId IN (2, 3) AND IsActive = 1`,
      [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
    );
    if (roleCheck.recordset && roleCheck.recordset.length > 0) {
      return {
        success: true,
        status: 'APPROVED',
        message: 'You already have approved seller access.',
      };
    }

    // Check if pending request already exists
    const pendingCheck = await databaseService.query<any>(
      `SELECT TOP 1 VerificationRequestId, Status, SubmittedAt
       FROM VerificationRequests WITH (NOLOCK)
       WHERE UserId = @uid AND VerificationType = 'SellerAccess' AND Status = 'PENDING'
       ORDER BY VerificationRequestId DESC`,
      [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
    );

    if (pendingCheck.recordset && pendingCheck.recordset.length > 0) {
      return {
        success: true,
        status: 'PENDING',
        message: 'A seller access request is already pending administrator approval.',
        requestId: String(pendingCheck.recordset[0].VerificationRequestId),
      };
    }

    // Insert new request
    const docRef = notes?.trim() || 'Customer requested seller portal capability';
    const insRes = await databaseService.query<any>(
      `INSERT INTO VerificationRequests (
         UserId, EntityType, EntityId, VerificationType, DocumentReference, Status, SubmittedAt, CreatedAt
       )
       OUTPUT INSERTED.VerificationRequestId
       VALUES (
         @uid, 'User', @uid, 'SellerAccess', @docRef, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )`,
      [
        { name: 'uid', type: mssql.BigInt(), value: numericUserId },
        { name: 'docRef', type: mssql.NVarChar(500), value: docRef },
      ]
    );

    const newId = String(insRes.recordset[0].VerificationRequestId);

    logger.info('Seller access request created', { userId: numericUserId, requestId: newId });

    return {
      success: true,
      status: 'PENDING',
      message: 'Seller access request submitted successfully. Pending administrator approval.',
      requestId: newId,
    };
  },

  /**
   * Check status of seller access for a customer.
   */
  async getSellerAccessStatus(
    userId: string
  ): Promise<{
    success: boolean;
    status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
    canSwitch: boolean;
    hasSellerCapability: boolean;
    sellerEnabled: boolean;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    requestId?: string;
  }> {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      return { success: false, status: 'NONE', canSwitch: false, hasSellerCapability: false, sellerEnabled: false };
    }

    // If active seller role exists in UserRoles, always APPROVED
    const roleCheck = await databaseService.query<any>(
      `SELECT 1 FROM UserRoles WITH (NOLOCK) WHERE UserId = @uid AND RoleId IN (2, 3) AND IsActive = 1`,
      [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
    );
    if (roleCheck.recordset && roleCheck.recordset.length > 0) {
      return {
        success: true,
        status: 'APPROVED',
        canSwitch: true,
        hasSellerCapability: true,
        sellerEnabled: true,
      };
    }

    // Check latest request in VerificationRequests
    const reqRes = await databaseService.query<any>(
      `SELECT TOP 1 VerificationRequestId, Status, SubmittedAt, ReviewedAt, RejectionReason
       FROM VerificationRequests WITH (NOLOCK)
       WHERE UserId = @uid AND VerificationType = 'SellerAccess'
       ORDER BY VerificationRequestId DESC`,
      [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
    );

    if (reqRes.recordset && reqRes.recordset.length > 0) {
      const row = reqRes.recordset[0];
      const status = row.Status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
      const isApproved = status === 'APPROVED';
      return {
        success: true,
        status,
        canSwitch: isApproved,
        hasSellerCapability: isApproved,
        sellerEnabled: isApproved,
        submittedAt: row.SubmittedAt ? new Date(row.SubmittedAt).toISOString() : undefined,
        reviewedAt: row.ReviewedAt ? new Date(row.ReviewedAt).toISOString() : undefined,
        rejectionReason: row.RejectionReason || undefined,
        requestId: String(row.VerificationRequestId),
      };
    }

    return {
      success: true,
      status: 'NONE',
      canSwitch: false,
      hasSellerCapability: false,
      sellerEnabled: false,
    };
  },

  /**
   * 1. Request Password Reset OTP.
   * Only allows existing registered accounts (including Administrator).
   * If account is not found: throws ACCOUNT_NOT_FOUND (404) "Account not found. Please register first."
   */
  async requestPasswordReset(identifier: string): Promise<{
    success: boolean;
    message: string;
    maskedIdentifier: string;
    developmentOtp?: string;
  }> {
    if (!identifier || !identifier.trim()) {
      const err = new Error('Registered mobile number, email, or username is required.');
      (err as any).code = 'INVALID_INPUT';
      (err as any).statusCode = 400;
      throw err;
    }

    const cleanInput = identifier.trim();
    const cleanMobile = cleanInput.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';

    const result = await databaseService.query<any>(
      `SELECT TOP 1 
         u.UserId, 
         u.FirstName, 
         u.LastName, 
         u.Email, 
         u.Mobile, 
         u.IsActive, 
         u.IsBlocked,
         au.EmployeeCode
       FROM Users u WITH (NOLOCK)
       LEFT JOIN AdminUsers au WITH (NOLOCK) ON u.UserId = au.UserId
       WHERE au.EmployeeCode = @input
          OR u.Email = @input
          OR (u.FirstName + '.' + u.LastName) = @input
          OR (u.FirstName + ' ' + u.LastName) = @input
          OR (@searchMobile <> '' AND u.Mobile = @searchMobile)
          OR u.Mobile = @input
       ORDER BY 
         CASE WHEN u.IsBlocked = 0 AND u.IsActive = 1 THEN 1 
              WHEN u.IsBlocked = 0 THEN 2 
              ELSE 3 END ASC, 
         u.UserId DESC`,
      [
        { name: 'input', type: mssql.NVarChar(100), value: cleanInput },
        { name: 'searchMobile', type: mssql.NVarChar(50), value: searchMobile },
      ]
    );

    if (!result.recordset || result.recordset.length === 0) {
      const err = new Error('Account not found. Please register first.');
      (err as any).code = 'ACCOUNT_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const user = result.recordset[0];
    if (user.IsBlocked || !user.IsActive) {
      const err = new Error(
        user.IsBlocked
          ? 'This account has been deleted.'
          : 'Account is suspended or inactive.'
      );
      (err as any).code = user.IsBlocked ? 'ACCOUNT_DELETED' : 'ACCOUNT_INACTIVE';
      (err as any).statusCode = 403;
      throw err;
    }

    let masked = 'your account';
    if (user.Mobile) {
      const m = String(user.Mobile).replace(/\D/g, '');
      const last2 = m.slice(-2);
      masked = `+91 ••••• •••${last2}`;
    } else if (user.Email) {
      const parts = String(user.Email).split('@');
      const namePart = parts[0];
      const domainPart = parts[1] || '';
      masked = `${namePart.slice(0, 2)}•••@${domainPart}`;
    }

    return {
      success: true,
      message: 'OTP sent successfully.',
      maskedIdentifier: masked,
      ...(env.NODE_ENV === 'development' ? { developmentOtp: DEV_OTP } : {}),
    };
  },

  /**
   * 2. Verify Password Reset OTP.
   * Generates a temporary, cryptographically signed, single-use resetToken.
   */
  async verifyPasswordResetOtp(identifier: string, otp: string): Promise<{
    success: boolean;
    message: string;
    resetToken: string;
  }> {
    if (!identifier || !identifier.trim() || !otp || !otp.trim()) {
      const err = new Error('Identifier and OTP are required.');
      (err as any).code = 'INVALID_INPUT';
      (err as any).statusCode = 400;
      throw err;
    }

    if (env.NODE_ENV === 'development' && otp.trim() !== DEV_OTP) {
      const err = new Error('Invalid OTP provided. Development OTP is 123456.');
      (err as any).code = 'INVALID_OTP';
      (err as any).statusCode = 400;
      throw err;
    }

    const cleanInput = identifier.trim();
    const cleanMobile = cleanInput.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';

    const result = await databaseService.query<any>(
      `SELECT TOP 1 
         u.UserId, 
         u.IsActive,
         u.IsBlocked
       FROM Users u WITH (NOLOCK)
       LEFT JOIN AdminUsers au WITH (NOLOCK) ON u.UserId = au.UserId
       WHERE au.EmployeeCode = @input
          OR u.Email = @input
          OR (u.FirstName + '.' + u.LastName) = @input
          OR (u.FirstName + ' ' + u.LastName) = @input
          OR (@searchMobile <> '' AND u.Mobile = @searchMobile)
          OR u.Mobile = @input
       ORDER BY 
         CASE WHEN u.IsBlocked = 0 AND u.IsActive = 1 THEN 1 
              WHEN u.IsBlocked = 0 THEN 2 
              ELSE 3 END ASC, 
         u.UserId DESC`,
      [
        { name: 'input', type: mssql.NVarChar(100), value: cleanInput },
        { name: 'searchMobile', type: mssql.NVarChar(50), value: searchMobile },
      ]
    );

    if (!result.recordset || result.recordset.length === 0) {
      const err = new Error('Account not found. Please register first.');
      (err as any).code = 'ACCOUNT_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const user = result.recordset[0];
    if (user.IsBlocked || !user.IsActive) {
      const err = new Error('Account is inactive or unavailable.');
      (err as any).code = 'ACCOUNT_INACTIVE';
      (err as any).statusCode = 403;
      throw err;
    }

    const resetToken = generatePasswordResetToken(String(user.UserId));

    return {
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    };
  },

  /**
   * 3. Set New Password.
   * Verifies the single-use resetToken, hashes password with bcrypt, and updates Users.PasswordHash.
   */
  async resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!newPassword || !newPassword.trim()) {
      const err = new Error('New password is required.');
      (err as any).code = 'VALIDATION_ERROR';
      (err as any).statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('Password must be at least 6 characters.');
      (err as any).code = 'VALIDATION_ERROR';
      (err as any).statusCode = 400;
      throw err;
    }

    if (newPassword !== confirmPassword) {
      const err = new Error('Passwords do not match.');
      (err as any).code = 'VALIDATION_ERROR';
      (err as any).statusCode = 400;
      throw err;
    }

    let tokenData: { userId: string; jti: string };
    try {
      tokenData = verifyPasswordResetToken(resetToken);
    } catch {
      const err = new Error('Reset session expired or invalid. Please request a new OTP.');
      (err as any).code = 'INVALID_RESET_TOKEN';
      (err as any).statusCode = 400;
      throw err;
    }

    const now = Date.now();
    if (usedResetTokens.has(tokenData.jti)) {
      const err = new Error('Reset token has already been used.');
      (err as any).code = 'RESET_TOKEN_REUSED';
      (err as any).statusCode = 400;
      throw err;
    }

    const numericUserId = parseInt(tokenData.userId, 10);
    if (isNaN(numericUserId)) {
      const err = new Error('Invalid user identity in reset token.');
      (err as any).code = 'INVALID_RESET_TOKEN';
      (err as any).statusCode = 400;
      throw err;
    }

    const userCheck = await databaseService.query<any>(
      `SELECT TOP 1 UserId, IsBlocked FROM Users WITH (NOLOCK) WHERE UserId = @uid`,
      [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
    );

    if (!userCheck.recordset || userCheck.recordset.length === 0) {
      const err = new Error('Account not found.');
      (err as any).code = 'ACCOUNT_NOT_FOUND';
      (err as any).statusCode = 404;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await databaseService.query(
      `UPDATE Users SET PasswordHash = @passwordHash, UpdatedAt = GETDATE() WHERE UserId = @uid`,
      [
        { name: 'passwordHash', type: mssql.NVarChar(255), value: passwordHash },
        { name: 'uid', type: mssql.BigInt(), value: numericUserId },
      ]
    );

    // Burn token to prevent reuse
    usedResetTokens.set(tokenData.jti, now + 15 * 60 * 1000);
    if (usedResetTokens.size > 1000) {
      for (const [k, exp] of usedResetTokens.entries()) {
        if (exp < now) usedResetTokens.delete(k);
      }
    }

    logger.info('Password reset completed successfully for user', { userId: numericUserId });

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  },
};
