import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { UserRole } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  sellerType?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  website?: string;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  status: 'active' | 'suspended' | 'pending';
  verified: boolean;
  walletBalance: number;
  sellerAccessStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  sellerEnabled?: boolean;
  canSwitchToSeller?: boolean;
  hasSellerCapability?: boolean;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  occupation?: string;
  sellerType?: string;
  shopType?: string;
  categories?: string[];
  education?: string;
  website?: string;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfileData | null> {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      return null;
    }

    try {
      const result = await databaseService.query<any>(
        `SELECT TOP 1 
           u.UserId, 
           u.FirstName, 
           u.LastName, 
           u.Email, 
           u.Mobile, 
           u.ProfileImageUrl AS UserAvatar, 
           u.IsActive, 
           u.IsBlocked,
           p.Bio, 
           p.Occupation, 
           p.Education, 
           p.Website, 
           p.ProfileImageUrl AS ProfileAvatar,
           r.RoleCode
         FROM Users u WITH (NOLOCK)
         LEFT JOIN UserProfiles p WITH (NOLOCK) ON u.UserId = p.UserId
         LEFT JOIN UserRoles ur WITH (NOLOCK) ON u.UserId = ur.UserId AND ur.IsPrimaryRole = 1
         LEFT JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
         WHERE u.UserId = @userId`,
        [{ name: 'userId', type: mssql.BigInt(), value: numericUserId }]
      );

      if (result.recordset && result.recordset.length > 0) {
        const row = result.recordset[0];
        const rawRole = row.RoleCode ? String(row.RoleCode).toLowerCase() : 'customer';
        const role = (['customer', 'seller', 'administrator'].includes(rawRole) ? rawRole : 'customer') as UserRole;
        const firstName = row.FirstName || 'ECOSPHERE';
        const lastName = row.LastName || 'Member';
        const fullName = `${firstName} ${lastName}`.trim();
        const status: 'active' | 'suspended' | 'pending' = row.IsBlocked ? 'suspended' : row.IsActive === false ? 'pending' : 'active';

        let preferences: Record<string, any> = {};
        if (row.Bio && typeof row.Bio === 'string' && row.Bio.trim().startsWith('{') && row.Bio.trim().endsWith('}')) {
          try {
            preferences = JSON.parse(row.Bio);
          } catch {
            preferences = {};
          }
        }

        const sellerType = role === 'seller' ? (preferences.sellerType || row.Occupation || 'Shop Owner') : undefined;

        // Check seller capability in UserRoles
        const sellerCapabilityCheck = await databaseService.query<any>(
          `SELECT 1 FROM UserRoles WITH (NOLOCK) WHERE UserId = @uid AND RoleId IN (2, 3) AND IsActive = 1`,
          [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
        );
        let hasSellerCapability = (sellerCapabilityCheck.recordset?.length || 0) > 0;

        let sellerAccessStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' = hasSellerCapability ? 'APPROVED' : 'NONE';

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
          `SELECT TOP 1 
             UserLocationId,
             Area,
             City,
             State,
             Country,
             PostalCode,
             Latitude,
             Longitude,
             LocationSource
           FROM UserLocations WITH (NOLOCK)
           WHERE UserId = @uid AND IsActive = 1
           ORDER BY IsPrimary DESC, UpdatedAt DESC, UserLocationId DESC`,
          [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
        );

        let city: string | undefined = undefined;
        let state: string | undefined = undefined;
        let country: string = 'India';
        let area: string | undefined = undefined;
        let postalCode: string | undefined = undefined;
        let latitude: number | undefined = undefined;
        let longitude: number | undefined = undefined;
        let locationDisplay: string | undefined = undefined;

        if (locResult.recordset && locResult.recordset.length > 0) {
          const locRow = locResult.recordset[0];
          city = locRow.City || undefined;
          state = locRow.State || undefined;
          country = locRow.Country || 'India';
          area = locRow.Area || undefined;
          postalCode = locRow.PostalCode || undefined;
          latitude = locRow.Latitude != null ? Number(locRow.Latitude) : undefined;
          longitude = locRow.Longitude != null ? Number(locRow.Longitude) : undefined;

          if (city) {
            if (area) {
              locationDisplay = `${area}, ${city}`;
            } else if (state) {
              locationDisplay = `${city}, ${state}`;
            } else {
              locationDisplay = city;
            }
          }
        }

        return {
          id: String(row.UserId),
          firstName,
          lastName,
          name: fullName,
          email: row.Email || `user_${row.UserId}@ecosphere.io`,
          phone: row.Mobile || '',
          role,
          sellerType,
          bio: preferences.bio || row.Bio || 'ECOSPHERE Ecosystem Member',
          occupation: row.Occupation || 'Community Member',
          education: row.Education || '',
          website: row.Website || '',
          profileImageUrl: row.ProfileAvatar || row.UserAvatar || '',
          preferences,
          status,
          verified: true,
          walletBalance: 5000,
          sellerAccessStatus,
          sellerEnabled: hasSellerCapability,
          canSwitchToSeller: hasSellerCapability,
          hasSellerCapability,
          city,
          state,
          country,
          area,
          postalCode,
          latitude,
          longitude,
          location: locationDisplay,
        };
      }
    } catch (dbError) {
      const err = dbError as Error;
      logger.error('Database error fetching profile', { message: err.message, userId });
    }

    return null;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileData> {
    let profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found in database');
    }

    const dbUserId = parseInt(profile.id, 10);

    try {
      // 1. Update Users table
      if (input.firstName !== undefined || input.lastName !== undefined || input.profileImageUrl !== undefined) {
        const updates: string[] = ['UpdatedAt = CURRENT_TIMESTAMP'];
        const params: Array<{ name: string; type: any; value: any }> = [
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
        ];

        if (input.firstName !== undefined) {
          updates.push('FirstName = @firstName');
          params.push({ name: 'firstName', type: mssql.NVarChar(50), value: input.firstName });
        }
        if (input.lastName !== undefined) {
          updates.push('LastName = @lastName');
          params.push({ name: 'lastName', type: mssql.NVarChar(50), value: input.lastName });
        }
        if (input.profileImageUrl !== undefined) {
          updates.push('ProfileImageUrl = @img');
          params.push({ name: 'img', type: mssql.NVarChar(500), value: input.profileImageUrl });
        }

        await databaseService.query(
          `UPDATE Users SET ${updates.join(', ')} WHERE UserId = @userId`,
          params
        );
      }

      // 2. Upsert UserProfiles table
      const profileCheck = await databaseService.query<any>(
        'SELECT Bio, Occupation FROM UserProfiles WHERE UserId = @userId',
        [{ name: 'userId', type: mssql.BigInt(), value: dbUserId }]
      );

      let currentPreferences: Record<string, any> = {};
      const existingBio = profileCheck.recordset?.[0]?.Bio || '';
      if (existingBio.trim().startsWith('{') && existingBio.trim().endsWith('}')) {
        try {
          currentPreferences = JSON.parse(existingBio);
        } catch {
          currentPreferences = {};
        }
      }

      const mergedPreferences = {
        ...currentPreferences,
        ...(input.preferences || {}),
        ...(input.sellerType ? { sellerType: input.sellerType } : {}),
        ...(input.shopType ? { shopType: input.shopType } : {}),
        ...(input.categories ? { categories: input.categories } : {}),
      };

      const targetOccupation =
        input.occupation ||
        (input.shopType && input.sellerType
          ? `${input.sellerType} - ${input.shopType}`
          : input.sellerType || profileCheck.recordset?.[0]?.Occupation);

      const targetBio =
        input.bio !== undefined
          ? input.bio
          : (input.categories || input.shopType || input.sellerType)
          ? JSON.stringify(mergedPreferences)
          : undefined;

      if (profileCheck.recordset && profileCheck.recordset.length > 0) {
        const pUpdates: string[] = ['UpdatedAt = CURRENT_TIMESTAMP'];
        const pParams: Array<{ name: string; type: any; value: any }> = [
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
        ];

        if (targetBio !== undefined) {
          pUpdates.push('Bio = @bio');
          pParams.push({ name: 'bio', type: mssql.NVarChar(500), value: targetBio });
        }
        if (targetOccupation !== undefined) {
          pUpdates.push('Occupation = @occ');
          pParams.push({ name: 'occ', type: mssql.NVarChar(100), value: targetOccupation });
        }
        if (input.education !== undefined) {
          pUpdates.push('Education = @edu');
          pParams.push({ name: 'edu', type: mssql.NVarChar(100), value: input.education });
        }
        if (input.website !== undefined) {
          pUpdates.push('Website = @web');
          pParams.push({ name: 'web', type: mssql.NVarChar(255), value: input.website });
        }

        await databaseService.query(
          `UPDATE UserProfiles SET ${pUpdates.join(', ')} WHERE UserId = @userId`,
          pParams
        );
      } else {
        await databaseService.query(
          `INSERT INTO UserProfiles (UserId, Bio, Occupation, Education, Website, ProfileImageUrl, IsProfileComplete, CreatedAt)
           VALUES (@userId, @bio, @occ, @edu, @web, @imgUrl, 1, CURRENT_TIMESTAMP)`,
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'bio', type: mssql.NVarChar(500), value: targetBio || '' },
            { name: 'occ', type: mssql.NVarChar(100), value: targetOccupation || 'Member' },
            { name: 'edu', type: mssql.NVarChar(100), value: input.education || '' },
            { name: 'web', type: mssql.NVarChar(255), value: input.website || '' },
            { name: 'imgUrl', type: mssql.NVarChar(500), value: input.profileImageUrl || '' },
          ]
        );
      }

      // 3. Update UserLocations if location fields are provided
      if (
        input.city !== undefined ||
        input.state !== undefined ||
        input.country !== undefined ||
        input.area !== undefined ||
        input.postalCode !== undefined ||
        input.latitude !== undefined ||
        input.longitude !== undefined
      ) {
        if (input.city) {
          await this.updateLocation(userId, {
            city: input.city,
            state: input.state,
            country: input.country,
            area: input.area,
            postalCode: input.postalCode,
            latitude: input.latitude,
            longitude: input.longitude,
            locationSource: input.locationSource || 'PROFILE_UPDATE',
          });
        }
      }

      logger.info('User profile updated successfully', { userId: dbUserId });

      const updated = await this.getProfile(profile.id);
      if (!updated) {
        throw new Error('Profile update completed but failed to reload');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update profile in database', { userId, error: err.message });
      throw err;
    }
  },

  async updateLocation(
    userId: string,
    locationData: {
      city: string;
      state?: string;
      country?: string;
      area?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
      locationSource?: string;
    }
  ): Promise<UserProfileData> {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
      throw new Error('Invalid user ID');
    }

    const city = (locationData.city || '').trim();
    if (!city) {
      throw new Error('City is required');
    }
    const state = locationData.state?.trim() || null;
    const country = locationData.country?.trim() || 'India';
    const area = locationData.area?.trim() || null;
    const postalCode = locationData.postalCode?.trim() || null;
    const latitude = locationData.latitude != null ? locationData.latitude : null;
    const longitude = locationData.longitude != null ? locationData.longitude : null;
    const locationSource = locationData.locationSource?.trim() || 'MANUAL';

    try {
      const existingLoc = await databaseService.query<any>(
        `SELECT TOP 1 UserLocationId 
         FROM UserLocations WITH (NOLOCK) 
         WHERE UserId = @uid AND IsActive = 1
         ORDER BY IsPrimary DESC, UpdatedAt DESC, UserLocationId DESC`,
        [{ name: 'uid', type: mssql.BigInt(), value: numericUserId }]
      );

      if (existingLoc.recordset && existingLoc.recordset.length > 0) {
        const userLocationId = existingLoc.recordset[0].UserLocationId;
        await databaseService.query(
          `UPDATE UserLocations 
           SET City = @city,
               State = @state,
               Country = @country,
               Area = @area,
               PostalCode = @postalCode,
               Latitude = @lat,
               Longitude = @lon,
               LocationSource = @source,
               IsPrimary = 1,
               IsActive = 1,
               UpdatedAt = CURRENT_TIMESTAMP
           WHERE UserLocationId = @locId`,
          [
            { name: 'city', type: mssql.NVarChar(150), value: city },
            { name: 'state', type: mssql.NVarChar(150), value: state },
            { name: 'country', type: mssql.NVarChar(100), value: country },
            { name: 'area', type: mssql.NVarChar(150), value: area },
            { name: 'postalCode', type: mssql.NVarChar(20), value: postalCode },
            { name: 'lat', type: mssql.Decimal(10, 7), value: latitude },
            { name: 'lon', type: mssql.Decimal(10, 7), value: longitude },
            { name: 'source', type: mssql.VarChar(30), value: locationSource },
            { name: 'locId', type: mssql.BigInt(), value: userLocationId },
          ]
        );
      } else {
        await databaseService.query(
          `INSERT INTO UserLocations (
             UserId, AddressLine1, AddressLine2, Area, City, State, Country, PostalCode,
             Latitude, Longitude, LocationSource, IsPrimary, IsActive, CreatedAt, UpdatedAt
           )
           VALUES (
             @uid, '', '', @area, @city, @state, @country, @postalCode,
             @lat, @lon, @source, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
           )`,
          [
            { name: 'uid', type: mssql.BigInt(), value: numericUserId },
            { name: 'city', type: mssql.NVarChar(150), value: city },
            { name: 'state', type: mssql.NVarChar(150), value: state },
            { name: 'country', type: mssql.NVarChar(100), value: country },
            { name: 'area', type: mssql.NVarChar(150), value: area },
            { name: 'postalCode', type: mssql.NVarChar(20), value: postalCode },
            { name: 'lat', type: mssql.Decimal(10, 7), value: latitude },
            { name: 'lon', type: mssql.Decimal(10, 7), value: longitude },
            { name: 'source', type: mssql.VarChar(30), value: locationSource },
          ]
        );
      }

      logger.info('User location updated successfully in database', { userId: numericUserId, city, state });

      const updated = await this.getProfile(userId);
      if (!updated) {
        throw new Error('Failed to reload profile after location update');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update user location in database', { userId, error: err.message });
      throw err;
    }
  },
};
