import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface ServiceItem {
  id: string;
  businessId: string;
  businessName: string;
  providerName: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  durationMinutes: number;
  category: string;
  categoryId?: number;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  distance: string;
  location: string;
  availability: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  businessId?: string;
  city?: string;
}

export interface CreateServiceInput {
  businessId: string;
  serviceName: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  serviceCategoryId?: number;
  serviceImageUrl?: string;
  locationType?: string;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  isAvailable?: boolean;
}

function mapDbRowToService(row: any): ServiceItem {
  const provider = `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'Master Technician';
  const durationMin = row.DurationMinutes ? Number(row.DurationMinutes) : 60;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durationStr = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours} Hours`) : `${mins} Mins`;

  return {
    id: String(row.ServiceId),
    businessId: String(row.BusinessId || '1'),
    businessName: row.BusinessName || 'ECOSPHERE Local Business',
    providerName: provider,
    title: row.ServiceName,
    description: row.Description || '',
    price: row.Price ? Number(row.Price) : 499,
    duration: durationStr,
    durationMinutes: durationMin,
    category: row.CategoryName || 'Home Services',
    categoryId: row.ServiceCategoryId ? Number(row.ServiceCategoryId) : undefined,
    imageUrl: row.ServiceImageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewsCount: 120,
    distance: '1.5 km',
    location: `${row.Area || 'Central'}, ${row.City || 'Pune'}`,
    availability: row.IsAvailable ? 'Available Today' : 'Slot Full',
    isAvailable: Boolean(row.IsAvailable),
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const numericId = parseInt(userIdStr.replace(/\D/g, ''), 10);
  if (!isNaN(numericId) && numericId > 0) {
    const userById = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WHERE UserId = @numId',
      [{ name: 'numId', type: mssql.BigInt(), value: numericId }]
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

export const serviceService = {
  async getServices(options: ServiceFilterOptions): Promise<{ services: ServiceItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const hasSearch = Boolean(options.search && options.search.trim());
    const hasCity = Boolean(options.city && options.city.trim());
    const hasCategory = Boolean(options.categoryId && options.categoryId > 0);

    const numericBizId = options.businessId ? parseInt(options.businessId.replace(/\D/g, ''), 10) : NaN;
    const hasBizId = !isNaN(numericBizId) && numericBizId > 0;

    const conditions: string[] = ['s.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (hasSearch) {
      conditions.push('(s.ServiceName LIKE @search OR s.Description LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(100), value: `%${options.search!.trim()}%` });
    }
    if (hasCity) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city!.trim()}%` });
    }
    if (hasCategory) {
      conditions.push('s.ServiceCategoryId = @categoryId');
      params.push({ name: 'categoryId', type: mssql.Int(), value: options.categoryId });
    }
    if (hasBizId) {
      conditions.push('s.BusinessId = @bizId');
      params.push({ name: 'bizId', type: mssql.BigInt(), value: numericBizId });
    }

    const whereClause = conditions.join(' AND ');

    try {
      const countResult = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Services s 
         LEFT JOIN Businesses b ON s.BusinessId = b.BusinessId 
         WHERE ${whereClause}`,
        params
      );
      const total = countResult.recordset[0]?.total || 0;

      const queryParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataResult = await databaseService.query<any>(
        `SELECT 
           s.ServiceId, s.ServiceProviderId, s.BusinessId, s.ServiceCategoryId, s.ServiceName,
           s.Description, s.Price, s.PricingType, s.DurationMinutes, s.ServiceImageUrl, s.LocationType,
           s.IsAvailable, s.IsActive, s.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area,
           u.FirstName, u.LastName
         FROM Services s
         LEFT JOIN ServiceCategories c ON s.ServiceCategoryId = c.ServiceCategoryId
         LEFT JOIN Businesses b ON s.BusinessId = b.BusinessId
         LEFT JOIN Users u ON b.OwnerUserId = u.UserId
         WHERE ${whereClause}
         ORDER BY s.ServiceId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        queryParams
      );

      const services = dataResult.recordset.map(mapDbRowToService);
      const totalPages = Math.ceil(total / limit) || 1;

      return { services, total, page, totalPages };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query services list', { error: err.message });
      throw err;
    }
  },

  async getServiceById(serviceId: string): Promise<ServiceItem | null> {
    const numericId = parseInt(serviceId.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) return null;

    try {
      const result = await databaseService.query<any>(
        `SELECT 
           s.ServiceId, s.ServiceProviderId, s.BusinessId, s.ServiceCategoryId, s.ServiceName,
           s.Description, s.Price, s.PricingType, s.DurationMinutes, s.ServiceImageUrl, s.LocationType,
           s.IsAvailable, s.IsActive, s.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area,
           u.FirstName, u.LastName
         FROM Services s
         LEFT JOIN ServiceCategories c ON s.ServiceCategoryId = c.ServiceCategoryId
         LEFT JOIN Businesses b ON s.BusinessId = b.BusinessId
         LEFT JOIN Users u ON b.OwnerUserId = u.UserId
         WHERE s.ServiceId = @serviceId`,
        [{ name: 'serviceId', type: mssql.BigInt(), value: numericId }]
      );

      if (result.recordset && result.recordset.length > 0) {
        return mapDbRowToService(result.recordset[0]);
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query service by ID', { serviceId, error: err.message });
    }

    return null;
  },

  async getMyServices(userId: string, businessId?: string): Promise<ServiceItem[]> {
    try {
      const dbUserId = await resolveDbUserId(userId);
      const numericBizId = businessId ? parseInt(businessId.replace(/\D/g, ''), 10) : NaN;
      const hasBiz = !isNaN(numericBizId) && numericBizId > 0;

      const params: Array<{ name: string; type: any; value: any }> = [
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }
      ];
      let bizFilter = '';
      if (hasBiz) {
        bizFilter = ' AND s.BusinessId = @businessId';
        params.push({ name: 'businessId', type: mssql.BigInt(), value: numericBizId });
      }

      const result = await databaseService.query<any>(
        `SELECT 
           s.ServiceId, s.ServiceProviderId, s.BusinessId, s.ServiceCategoryId, s.ServiceName,
           s.Description, s.Price, s.PricingType, s.DurationMinutes, s.ServiceImageUrl, s.LocationType,
           s.IsAvailable, s.IsActive, s.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.Area,
           u.FirstName, u.LastName
         FROM Services s
         LEFT JOIN ServiceCategories c ON s.ServiceCategoryId = c.ServiceCategoryId
         INNER JOIN Businesses b ON s.BusinessId = b.BusinessId
         LEFT JOIN Users u ON b.OwnerUserId = u.UserId
         WHERE (b.OwnerUserId = @dbUserId OR s.ServiceProviderId = @dbUserId)${bizFilter}
         ORDER BY s.ServiceId DESC`,
        params
      );

      return result.recordset.map(mapDbRowToService);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller services', { userId, error: err.message });
      throw err;
    }
  },

  async createService(userId: string, isUserAdmin: boolean, input: CreateServiceInput): Promise<ServiceItem> {
    const dbUserId = await resolveDbUserId(userId);
    const numericBizId = parseInt(input.businessId.replace(/\D/g, ''), 10);

    if (isNaN(numericBizId)) {
      throw new Error('Valid Business ID required to create a service');
    }

    // Verify Business ownership
    if (!isUserAdmin) {
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Businesses WHERE BusinessId = @bizId AND OwnerUserId = @dbUserId`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_BUSINESS_OWNERSHIP');
      }
    }

    try {
      const result = await databaseService.query<any>(
        `INSERT INTO Services (
           ServiceProviderId, BusinessId, ServiceCategoryId, ServiceName, Description,
           Price, PricingType, DurationMinutes, ServiceImageUrl, LocationType,
           IsAvailable, IsActive, CreatedAt
         )
         OUTPUT INSERTED.ServiceId
         VALUES (
           @dbUserId, @bizId, @catId, @name, @desc,
           @price, 'FIXED', @duration, @imgUrl, 'ON_SITE',
           1, 1, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'catId', type: mssql.Int(), value: input.serviceCategoryId || 1 },
          { name: 'name', type: mssql.NVarChar(250), value: input.serviceName },
          { name: 'desc', type: mssql.NVarChar(2000), value: input.description || '' },
          { name: 'price', type: mssql.Decimal(18, 2), value: input.price },
          { name: 'duration', type: mssql.Int(), value: input.durationMinutes || 60 },
          { name: 'imgUrl', type: mssql.NVarChar(1000), value: input.serviceImageUrl || '' },
        ]
      );

      const newId = String(result.recordset[0].ServiceId);
      const created = await this.getServiceById(newId);
      if (!created) {
        throw new Error('Service created but failed to retrieve record');
      }
      return created;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create service in database', { userId, error: err.message });
      throw err;
    }
  },

  async updateService(
    serviceId: string,
    requestingUserId: string,
    isUserAdmin: boolean,
    input: UpdateServiceInput
  ): Promise<ServiceItem> {
    const existing = await this.getServiceById(serviceId);
    if (!existing) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const numericServiceId = parseInt(existing.id, 10);

    // Cross-seller & Cross-business ownership check
    if (!isUserAdmin) {
      const numericBizId = parseInt(existing.businessId, 10);
      const bizCheck = await databaseService.query<any>(
        `SELECT 1 FROM Businesses WHERE BusinessId = @bizId AND OwnerUserId = @dbUserId`,
        [
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error('FORBIDDEN_OWNERSHIP');
      }
    }

    const updates: string[] = ['UpdatedAt = CURRENT_TIMESTAMP'];
    const params: Array<{ name: string; type: any; value: any }> = [
      { name: 'srvId', type: mssql.BigInt(), value: numericServiceId },
    ];

    if (input.serviceName !== undefined) {
      updates.push('ServiceName = @sName');
      params.push({ name: 'sName', type: mssql.NVarChar(250), value: input.serviceName });
    }
    if (input.description !== undefined) {
      updates.push('Description = @desc');
      params.push({ name: 'desc', type: mssql.NVarChar(2000), value: input.description });
    }
    if (input.price !== undefined) {
      updates.push('Price = @price');
      params.push({ name: 'price', type: mssql.Decimal(18, 2), value: input.price });
    }
    if (input.durationMinutes !== undefined) {
      updates.push('DurationMinutes = @duration');
      params.push({ name: 'duration', type: mssql.Int(), value: input.durationMinutes });
    }
    if (input.serviceCategoryId !== undefined) {
      updates.push('ServiceCategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: input.serviceCategoryId });
    }
    if (input.serviceImageUrl !== undefined) {
      updates.push('ServiceImageUrl = @imgUrl');
      params.push({ name: 'imgUrl', type: mssql.NVarChar(1000), value: input.serviceImageUrl });
    }
    if (input.isAvailable !== undefined) {
      updates.push('IsAvailable = @avail');
      params.push({ name: 'avail', type: mssql.Bit, value: input.isAvailable ? 1 : 0 });
    }

    try {
      await databaseService.query(
        `UPDATE Services SET ${updates.join(', ')} WHERE ServiceId = @srvId`,
        params
      );

      const updated = await this.getServiceById(serviceId);
      if (!updated) {
        throw new Error('Service updated but failed to reload');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update service', { serviceId, error: err.message });
      throw err;
    }
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; icon: string }>> {
    try {
      const result = await databaseService.query<any>(
        'SELECT ServiceCategoryId, CategoryName, Description, IconName FROM ServiceCategories WHERE IsActive = 1 ORDER BY ServiceCategoryId ASC'
      );
      return (result.recordset || []).map((row: any) => ({
        id: Number(row.ServiceCategoryId),
        name: row.CategoryName,
        description: row.Description || '',
        icon: row.IconName || 'Wrench',
      }));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to fetch service categories', { error: err.message });
      throw err;
    }
  },
};
