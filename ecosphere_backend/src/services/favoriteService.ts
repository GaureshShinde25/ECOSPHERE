import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface SavedServiceDetail {
  savedId: string;
  serviceId: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  savedAt: string;
}

export interface SavedProductDetail {
  savedId: string;
  productId: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  savedAt: string;
}

export interface SavedJobDetail {
  savedId: string;
  jobId: string;
  businessId?: string;
  employerName: string;
  title: string;
  category: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  jobType: string;
  savedAt: string;
}

export interface SavedBusinessDetail {
  followId: string;
  businessId: string;
  ownerUserId: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  logoUrl?: string;
  coverUrl?: string;
  followedAt: string;
}

export interface UserFavoritesResponse {
  services: SavedServiceDetail[];
  products: SavedProductDetail[];
  jobs: SavedJobDetail[];
  businesses: SavedBusinessDetail[];
  total: number;
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    const userById = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WHERE UserId = @numId',
      [{ name: 'numId', type: mssql.BigInt(), value: directId }]
    );
    if (userById.recordset && userById.recordset.length > 0) {
      return Number(userById.recordset[0].UserId);
    }
  }

  const cleanMobile = userIdStr.replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';

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

export const favoriteService = {
  /**
   * Fetch all saved items (services, products, jobs, businesses) for authenticated user
   */
  async getFavorites(userIdStr: string): Promise<UserFavoritesResponse> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      // 1. Fetch Saved Services
      const servicesRes = await databaseService.query<any>(
        `SELECT 
           ss.SavedServiceId, ss.ServiceId, ss.CreatedAt AS SavedAt,
           s.BusinessId, s.ServiceName, s.Description, s.Price, s.ServiceImageUrl,
           c.CategoryName,
           b.BusinessName
         FROM SavedServices ss WITH (NOLOCK)
         INNER JOIN Services s WITH (NOLOCK) ON ss.ServiceId = s.ServiceId
         LEFT JOIN ServiceCategories c WITH (NOLOCK) ON s.ServiceCategoryId = c.ServiceCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
         WHERE ss.UserId = @dbUserId
         ORDER BY ss.SavedServiceId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const services: SavedServiceDetail[] = (servicesRes.recordset || []).map((r: any) => ({
        savedId: String(r.SavedServiceId),
        serviceId: String(r.ServiceId),
        businessId: String(r.BusinessId || '1'),
        businessName: r.BusinessName || 'ECOSPHERE Service',
        title: r.ServiceName,
        description: r.Description || '',
        price: r.Price ? Number(r.Price) : 499,
        category: r.CategoryName || 'Services',
        imageUrl: r.ServiceImageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        savedAt: r.SavedAt ? new Date(r.SavedAt).toISOString() : new Date().toISOString(),
      }));

      // 2. Fetch Saved Products
      const productsRes = await databaseService.query<any>(
        `SELECT 
           sp.SavedProductId, sp.ProductId, sp.CreatedAt AS SavedAt,
           p.BusinessId, p.ProductName, p.Description, p.Price, p.DiscountPrice, p.ProductImageUrl,
           c.CategoryName,
           b.BusinessName
         FROM SavedProducts sp WITH (NOLOCK)
         INNER JOIN Products p WITH (NOLOCK) ON sp.ProductId = p.ProductId
         LEFT JOIN ProductCategories c WITH (NOLOCK) ON p.ProductCategoryId = c.ProductCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
         WHERE sp.UserId = @dbUserId
         ORDER BY sp.SavedProductId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const products: SavedProductDetail[] = (productsRes.recordset || []).map((r: any) => ({
        savedId: String(r.SavedProductId),
        productId: String(r.ProductId),
        businessId: String(r.BusinessId || '1'),
        businessName: r.BusinessName || 'ECOSPHERE Merchant',
        title: r.ProductName,
        description: r.Description || '',
        price: r.DiscountPrice ? Number(r.DiscountPrice) : (r.Price ? Number(r.Price) : 499),
        category: r.CategoryName || 'Products',
        imageUrl: r.ProductImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        savedAt: r.SavedAt ? new Date(r.SavedAt).toISOString() : new Date().toISOString(),
      }));

      // 3. Fetch Saved Jobs
      const jobsRes = await databaseService.query<any>(
        `SELECT 
           sj.SavedJobId, sj.JobId, sj.CreatedAt AS SavedAt,
           j.BusinessId, j.EmployerUserId, j.JobTitle, j.Description, j.SalaryMin, j.SalaryMax, j.JobType,
           c.CategoryName,
           b.BusinessName, b.City,
           u.FirstName AS EmployerFirstName, u.LastName AS EmployerLastName
         FROM SavedJobs sj WITH (NOLOCK)
         INNER JOIN Jobs j WITH (NOLOCK) ON sj.JobId = j.JobId
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         LEFT JOIN Users u WITH (NOLOCK) ON j.EmployerUserId = u.UserId
         WHERE sj.UserId = @dbUserId
         ORDER BY sj.SavedJobId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const jobs: SavedJobDetail[] = (jobsRes.recordset || []).map((r: any) => ({
        savedId: String(r.SavedJobId),
        jobId: String(r.JobId),
        businessId: r.BusinessId ? String(r.BusinessId) : undefined,
        employerName: r.BusinessName || `${r.EmployerFirstName || ''} ${r.EmployerLastName || ''}`.trim() || 'ECOSPHERE Partner',
        title: r.JobTitle,
        category: r.CategoryName || 'Jobs',
        description: r.Description || '',
        salaryMin: r.SalaryMin ? Number(r.SalaryMin) : undefined,
        salaryMax: r.SalaryMax ? Number(r.SalaryMax) : undefined,
        location: r.City || 'Pune',
        jobType: r.JobType || 'FULL_TIME',
        savedAt: r.SavedAt ? new Date(r.SavedAt).toISOString() : new Date().toISOString(),
      }));

      // 4. Fetch Followed Businesses (via UserFollows)
      const businessesRes = await databaseService.query<any>(
        `SELECT 
           uf.FollowId, uf.FollowingUserId, uf.CreatedAt AS FollowedAt,
           b.BusinessId, b.BusinessName, b.City, b.Rating, b.LogoUrl, b.CoverImageUrl,
           c.CategoryName
         FROM UserFollows uf WITH (NOLOCK)
         INNER JOIN Businesses b WITH (NOLOCK) ON uf.FollowingUserId = b.OwnerUserId
         LEFT JOIN BusinessCategories c WITH (NOLOCK) ON b.CategoryId = c.CategoryId
         WHERE uf.FollowerUserId = @dbUserId
         ORDER BY uf.FollowId DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const businesses: SavedBusinessDetail[] = (businessesRes.recordset || []).map((r: any) => ({
        followId: String(r.FollowId),
        businessId: String(r.BusinessId),
        ownerUserId: String(r.FollowingUserId),
        name: r.BusinessName,
        category: r.CategoryName || 'Local Business',
        city: r.City || 'Pune',
        rating: r.Rating ? Number(r.Rating) : 4.5,
        logoUrl: r.LogoUrl || undefined,
        coverUrl: r.CoverImageUrl || undefined,
        followedAt: r.FollowedAt ? new Date(r.FollowedAt).toISOString() : new Date().toISOString(),
      }));

      const total = services.length + products.length + jobs.length + businesses.length;
      return { services, products, jobs, businesses, total };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching user favorites', { userIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Check if a specific entity is saved by the authenticated user
   */
  async isFavorite(userIdStr: string, entityType: string, entityIdStr: string): Promise<{ isFavorite: boolean; savedId?: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) return { isFavorite: false };

    const cleanType = entityType.toLowerCase();
    const numericEntityId = parseInt(entityIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericEntityId)) return { isFavorite: false };

    try {
      if (cleanType === 'service') {
        const res = await databaseService.query<any>(
          'SELECT TOP 1 SavedServiceId FROM SavedServices WITH (NOLOCK) WHERE UserId = @userId AND ServiceId = @entityId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'entityId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        if (res.recordset && res.recordset.length > 0) {
          return { isFavorite: true, savedId: String(res.recordset[0].SavedServiceId) };
        }
      } else if (cleanType === 'product') {
        const res = await databaseService.query<any>(
          'SELECT TOP 1 SavedProductId FROM SavedProducts WITH (NOLOCK) WHERE UserId = @userId AND ProductId = @entityId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'entityId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        if (res.recordset && res.recordset.length > 0) {
          return { isFavorite: true, savedId: String(res.recordset[0].SavedProductId) };
        }
      } else if (cleanType === 'job') {
        const res = await databaseService.query<any>(
          'SELECT TOP 1 SavedJobId FROM SavedJobs WITH (NOLOCK) WHERE UserId = @userId AND JobId = @entityId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'entityId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        if (res.recordset && res.recordset.length > 0) {
          return { isFavorite: true, savedId: String(res.recordset[0].SavedJobId) };
        }
      } else if (cleanType === 'business') {
        // Resolve OwnerUserId for BusinessId
        const bizRes = await databaseService.query<any>(
          'SELECT TOP 1 OwnerUserId FROM Businesses WITH (NOLOCK) WHERE BusinessId = @bizId',
          [{ name: 'bizId', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (bizRes.recordset && bizRes.recordset.length > 0) {
          const ownerId = Number(bizRes.recordset[0].OwnerUserId);
          const followRes = await databaseService.query<any>(
            'SELECT TOP 1 FollowId FROM UserFollows WITH (NOLOCK) WHERE FollowerUserId = @userId AND FollowingUserId = @followingId',
            [
              { name: 'userId', type: mssql.BigInt(), value: dbUserId },
              { name: 'followingId', type: mssql.BigInt(), value: ownerId },
            ]
          );
          if (followRes.recordset && followRes.recordset.length > 0) {
            return { isFavorite: true, savedId: String(followRes.recordset[0].FollowId) };
          }
        }
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed checking favorite status', { userIdStr, entityType, entityIdStr, error: err.message });
    }

    return { isFavorite: false };
  },

  /**
   * Add favorite / saved entity for authenticated user
   */
  async addFavorite(userIdStr: string, entityType: string, entityIdStr: string): Promise<{ success: boolean; isFavorite: boolean; savedId?: string; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const cleanType = entityType.toLowerCase();
    const numericEntityId = parseInt(entityIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericEntityId) || numericEntityId <= 0) {
      throw new Error('INVALID_ENTITY_ID');
    }

    const existingCheck = await this.isFavorite(userIdStr, cleanType, entityIdStr);
    if (existingCheck.isFavorite) {
      return { success: true, isFavorite: true, savedId: existingCheck.savedId, message: 'Item is already in favorites' };
    }

    try {
      if (cleanType === 'service') {
        // Entity existence check
        const srvCheck = await databaseService.query<any>(
          'SELECT 1 FROM Services WITH (NOLOCK) WHERE ServiceId = @id AND IsActive = 1',
          [{ name: 'id', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (!srvCheck.recordset || srvCheck.recordset.length === 0) {
          throw new Error('ENTITY_NOT_FOUND: Service does not exist');
        }

        const insertRes = await databaseService.query<any>(
          `INSERT INTO SavedServices (UserId, ServiceId, CreatedAt)
           OUTPUT INSERTED.SavedServiceId
           VALUES (@userId, @serviceId, CURRENT_TIMESTAMP)`,
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'serviceId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );

        const newId = String(insertRes.recordset[0].SavedServiceId);
        return { success: true, isFavorite: true, savedId: newId, message: 'Service saved to favorites' };
      }

      if (cleanType === 'product') {
        // Entity existence check
        const prodCheck = await databaseService.query<any>(
          'SELECT 1 FROM Products WITH (NOLOCK) WHERE ProductId = @id AND IsActive = 1',
          [{ name: 'id', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (!prodCheck.recordset || prodCheck.recordset.length === 0) {
          throw new Error('ENTITY_NOT_FOUND: Product does not exist');
        }

        const insertRes = await databaseService.query<any>(
          `INSERT INTO SavedProducts (UserId, ProductId, CreatedAt)
           OUTPUT INSERTED.SavedProductId
           VALUES (@userId, @productId, CURRENT_TIMESTAMP)`,
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'productId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );

        const newId = String(insertRes.recordset[0].SavedProductId);
        return { success: true, isFavorite: true, savedId: newId, message: 'Product saved to favorites' };
      }

      if (cleanType === 'job') {
        // Entity existence check
        const jobCheck = await databaseService.query<any>(
          'SELECT 1 FROM Jobs WITH (NOLOCK) WHERE JobId = @id AND IsActive = 1',
          [{ name: 'id', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (!jobCheck.recordset || jobCheck.recordset.length === 0) {
          throw new Error('ENTITY_NOT_FOUND: Job listing does not exist');
        }

        const insertRes = await databaseService.query<any>(
          `INSERT INTO SavedJobs (UserId, JobId, CreatedAt)
           OUTPUT INSERTED.SavedJobId
           VALUES (@userId, @jobId, CURRENT_TIMESTAMP)`,
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'jobId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );

        const newId = String(insertRes.recordset[0].SavedJobId);
        return { success: true, isFavorite: true, savedId: newId, message: 'Job saved to favorites' };
      }

      if (cleanType === 'business') {
        // Entity existence check & OwnerUserId resolution
        const bizCheck = await databaseService.query<any>(
          'SELECT OwnerUserId FROM Businesses WITH (NOLOCK) WHERE BusinessId = @id AND IsActive = 1',
          [{ name: 'id', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
          throw new Error('ENTITY_NOT_FOUND: Business does not exist');
        }

        const ownerUserId = Number(bizCheck.recordset[0].OwnerUserId);
        if (ownerUserId === dbUserId) {
          throw new Error('CANNOT_FOLLOW_SELF: You cannot follow your own business');
        }

        const insertRes = await databaseService.query<any>(
          `INSERT INTO UserFollows (FollowerUserId, FollowingUserId, CreatedAt)
           OUTPUT INSERTED.FollowId
           VALUES (@followerId, @followingId, CURRENT_TIMESTAMP)`,
          [
            { name: 'followerId', type: mssql.BigInt(), value: dbUserId },
            { name: 'followingId', type: mssql.BigInt(), value: ownerUserId },
          ]
        );

        const newId = String(insertRes.recordset[0].FollowId);
        return { success: true, isFavorite: true, savedId: newId, message: 'Business followed successfully' };
      }

      throw new Error('INVALID_ENTITY_TYPE: Supported types are service, product, job, business');
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UQ_Saved') || err.message.includes('UQ_UserFollows')) {
        return { success: true, isFavorite: true, message: 'Item already saved' };
      }
      logger.error('Failed adding favorite', { userIdStr, entityType, entityIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Remove favorite / saved entity for authenticated user
   */
  async removeFavorite(userIdStr: string, entityType: string, entityIdStr: string): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const cleanType = entityType.toLowerCase();
    const numericEntityId = parseInt(entityIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericEntityId) || numericEntityId <= 0) {
      throw new Error('INVALID_ENTITY_ID');
    }

    try {
      if (cleanType === 'service') {
        await databaseService.query(
          'DELETE FROM SavedServices WHERE UserId = @userId AND ServiceId = @serviceId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'serviceId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        return { success: true, isFavorite: false, message: 'Service removed from favorites' };
      }

      if (cleanType === 'product') {
        await databaseService.query(
          'DELETE FROM SavedProducts WHERE UserId = @userId AND ProductId = @productId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'productId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        return { success: true, isFavorite: false, message: 'Product removed from favorites' };
      }

      if (cleanType === 'job') {
        await databaseService.query(
          'DELETE FROM SavedJobs WHERE UserId = @userId AND JobId = @jobId',
          [
            { name: 'userId', type: mssql.BigInt(), value: dbUserId },
            { name: 'jobId', type: mssql.BigInt(), value: numericEntityId },
          ]
        );
        return { success: true, isFavorite: false, message: 'Job removed from favorites' };
      }

      if (cleanType === 'business') {
        const bizCheck = await databaseService.query<any>(
          'SELECT OwnerUserId FROM Businesses WHERE BusinessId = @id',
          [{ name: 'id', type: mssql.BigInt(), value: numericEntityId }]
        );
        if (bizCheck.recordset && bizCheck.recordset.length > 0) {
          const ownerUserId = Number(bizCheck.recordset[0].OwnerUserId);
          await databaseService.query(
            'DELETE FROM UserFollows WHERE FollowerUserId = @followerId AND FollowingUserId = @followingId',
            [
              { name: 'followerId', type: mssql.BigInt(), value: dbUserId },
              { name: 'followingId', type: mssql.BigInt(), value: ownerUserId },
            ]
          );
        }
        return { success: true, isFavorite: false, message: 'Unfollowed business' };
      }

      throw new Error('INVALID_ENTITY_TYPE: Supported types are service, product, job, business');
    } catch (error) {
      const err = error as Error;
      logger.error('Failed removing favorite', { userIdStr, entityType, entityIdStr, error: err.message });
      throw err;
    }
  },
};
