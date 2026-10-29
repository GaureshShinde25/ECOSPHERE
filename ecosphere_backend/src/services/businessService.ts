import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface BusinessItem {
  id: string;
  businessId?: string;
  ownerUserId: string;
  name: string;
  businessName?: string;
  businessType?: string;
  type?: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  address?: string;
  area?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationStatus: string;
  categoryId?: number;
  category: string;
  location: {
    area: string;
    city: string;
    state: string;
  };
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface BusinessFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  city?: string;
}

export interface CreateBusinessInput {
  businessName?: string;
  name?: string;
  businessType?: string;
  type?: string;
  description?: string;
  categoryId?: number;
  category?: string;
  shopCategory?: string;
  cafeCategory?: string;
  restaurantCategory?: string;
  hotelCategory?: string;
  serviceCategory?: string;
  technicalCategory?: string;
  wholesaleCategory?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  // Specialized attributes
  cuisines?: string[] | string;
  serviceModes?: string[] | string;
  services?: string[] | string;
  amenities?: string[] | string;
  averagePrice?: string;
  starRating?: number | string;
  checkInTime?: string;
  checkOutTime?: string;
  serviceArea?: string;
  radius?: string;
  pricingModel?: string;
  workingDays?: string;
  workingHours?: string;
  openingHours?: string;
  experience?: string;
  warehouseLocation?: string;
  minOrderQuantity?: string;
  moq?: string;
  bulkPricingSupported?: boolean;
  quotationSupported?: boolean;
  deliveryScope?: string;
  companySize?: string;
  attributes?: Record<string, any>;
}

function resolveCategoryIdFromText(text?: string, businessType?: string): number {
  const t = (businessType || '').toLowerCase();
  if (t === 'cafe' || t === 'café' || t === 'restaurant') return 1; // Food & Restaurant
  if (t === 'shop') return 2; // Retail
  if (t === 'hotel') return 12; // Hospitality
  if (t === 'service provider' || t === 'service_provider') return 10; // Home Services
  if (t === 'technician') return 10; // Home Services
  if (t.includes('wholesale') || t.includes('dealer')) return 11; // Manufacturing / Wholesale
  if (t === 'employer') return 9; // Professional Services
  if (t === 'other') return 15; // Other

  if (!text) return 2;
  const lower = text.toLowerCase();
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('eatery') || lower.includes('cafe') || lower.includes('bakery')) return 1;
  if (lower.includes('grocery') || lower.includes('clothing') || lower.includes('shop') || lower.includes('store') || lower.includes('retail')) return 2;
  if (lower.includes('tech') || lower.includes('mobile') || lower.includes('computer') || lower.includes('electronics')) return 3;
  if (lower.includes('health') || lower.includes('pharmacy') || lower.includes('medical') || lower.includes('clinic')) return 4;
  if (lower.includes('education') || lower.includes('tutor') || lower.includes('coaching') || lower.includes('school')) return 5;
  if (lower.includes('construction') || lower.includes('contractor') || lower.includes('builder')) return 6;
  if (lower.includes('auto') || lower.includes('car') || lower.includes('vehicle') || lower.includes('mechanic')) return 7;
  if (lower.includes('beauty') || lower.includes('salon') || lower.includes('spa') || lower.includes('wellness')) return 8;
  if (lower.includes('professional') || lower.includes('consulting') || lower.includes('legal') || lower.includes('lawyer') || lower.includes('employer') || lower.includes('firm')) return 9;
  if (lower.includes('service') || lower.includes('technician') || lower.includes('repair') || lower.includes('plumb') || lower.includes('electric') || lower.includes('cleaning')) return 10;
  if (lower.includes('wholesale') || lower.includes('dealer') || lower.includes('distributor') || lower.includes('manufacturing')) return 11;
  if (lower.includes('hotel') || lower.includes('resort') || lower.includes('hospitality') || lower.includes('homestay') || lower.includes('lodge')) return 12;
  if (lower.includes('delivery') || lower.includes('logistics') || lower.includes('courier') || lower.includes('transport') || lower.includes('freight')) return 13;
  if (lower.includes('finance') || lower.includes('accountant') || lower.includes('tax') || lower.includes('banking')) return 14;
  return 2;
}

function inferBusinessType(categoryName?: string, categoryId?: number): string {
  if (categoryId === 1) return 'Restaurant';
  if (categoryId === 2) return 'Shop';
  if (categoryId === 12) return 'Hotel';
  if (categoryId === 10) return 'Service Provider';
  if (categoryId === 11) return 'Wholesaler / Dealer';
  if (categoryId === 9) return 'Employer';
  const name = (categoryName || '').toLowerCase();
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('food')) return 'Restaurant';
  if (name.includes('hotel') || name.includes('hospitality')) return 'Hotel';
  if (name.includes('tech') || name.includes('repair')) return 'Technician';
  if (name.includes('service')) return 'Service Provider';
  if (name.includes('wholesale')) return 'Wholesaler / Dealer';
  return 'Shop';
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {}

function mapDbRowToBusiness(row: any): BusinessItem {
  let cleanDesc = row.Description || '';
  let parsedConfig: Record<string, any> = {};

  if (cleanDesc.includes('<!--ECOSPHERE_BIZ_CONFIG:')) {
    const match = cleanDesc.match(/<!--ECOSPHERE_BIZ_CONFIG:(.*?)-->/s);
    if (match && match[1]) {
      try {
        parsedConfig = JSON.parse(match[1]);
        cleanDesc = cleanDesc.replace(/<!--ECOSPHERE_BIZ_CONFIG:(.*?)-->/s, '').trim();
      } catch {
        // Safe fallback
      }
    }
  }

  const inferredType = inferBusinessType(row.CategoryName, row.CategoryId);
  const resolvedBusinessType = parsedConfig.businessType || inferredType;
  const resolvedCategory = parsedConfig.category || row.CategoryName || 'Local Business';

  return {
    id: String(row.BusinessId),
    businessId: String(row.BusinessId),
    ownerUserId: String(row.OwnerUserId),
    name: row.BusinessName,
    businessName: row.BusinessName,
    businessType: resolvedBusinessType,
    type: resolvedBusinessType,
    description: cleanDesc,
    logoUrl: row.LogoUrl || undefined,
    coverUrl: row.CoverImageUrl || undefined,
    coverImageUrl: row.CoverImageUrl || undefined,
    phone: row.Phone || '',
    email: row.Email || '',
    website: row.Website || '',
    addressLine1: row.AddressLine1 || '',
    address: row.AddressLine1 || '',
    area: row.Area || row.City || 'Central',
    city: row.City || 'Pune',
    state: row.State || 'Maharashtra',
    country: row.Country || 'India',
    postalCode: row.PostalCode || '',
    rating: row.Rating ? Number(row.Rating) : 4.5,
    reviewCount: row.ReviewCount ? Number(row.ReviewCount) : 0,
    verified: row.VerificationStatus === 'APPROVED',
    verificationStatus: row.VerificationStatus || 'APPROVED',
    categoryId: row.CategoryId ? Number(row.CategoryId) : undefined,
    category: resolvedCategory,
    location: {
      area: row.Area || 'Central',
      city: row.City || 'Pune',
      state: row.State || 'Maharashtra',
    },
    attributes: parsedConfig,
    metadata: parsedConfig,
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

export const businessService = {
  async getBusinesses(options: BusinessFilterOptions): Promise<{ businesses: BusinessItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const hasSearch = Boolean(options.search && options.search.trim());
    const hasCity = Boolean(options.city && options.city.trim() && options.city.trim().toLowerCase() !== 'all');
    const hasCategory = Boolean(options.categoryId && options.categoryId > 0);

    const conditions: string[] = ['b.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (hasSearch) {
      conditions.push('(b.BusinessName LIKE @search OR b.Description LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(100), value: `%${options.search!.trim()}%` });
    }
    if (hasCity) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city!.trim()}%` });
    }
    if (hasCategory) {
      conditions.push('b.CategoryId = @categoryId');
      params.push({ name: 'categoryId', type: mssql.Int(), value: options.categoryId });
    }

    const whereClause = conditions.join(' AND ');

    try {
      const countResult = await databaseService.query<any>(
        `SELECT COUNT(*) AS total FROM Businesses b WHERE ${whereClause}`,
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
           b.BusinessId, b.OwnerUserId, b.CategoryId, b.BusinessName, b.Description, b.LogoUrl, b.CoverImageUrl,
           b.Phone, b.Email, b.Website, b.AddressLine1, b.AddressLine2, b.Area, b.City, b.State, b.Country,
           b.PostalCode, b.Rating, b.ReviewCount, b.VerificationStatus, b.IsActive, b.CreatedAt,
           c.CategoryName
         FROM Businesses b
         LEFT JOIN BusinessCategories c ON b.CategoryId = c.CategoryId
         WHERE ${whereClause}
         ORDER BY b.BusinessId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        queryParams
      );

      const businesses = dataResult.recordset.map(mapDbRowToBusiness);
      const totalPages = Math.ceil(total / limit) || 1;

      return { businesses, total, page, totalPages };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query businesses list', { error: err.message });
      throw err;
    }
  },

  async getBusinessById(businessId: string): Promise<BusinessItem | null> {
    const numericId = parseInt(businessId.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) return null;

    try {
      const result = await databaseService.query<any>(
        `SELECT 
           b.BusinessId, b.OwnerUserId, b.CategoryId, b.BusinessName, b.Description, b.LogoUrl, b.CoverImageUrl,
           b.Phone, b.Email, b.Website, b.AddressLine1, b.AddressLine2, b.Area, b.City, b.State, b.Country,
           b.PostalCode, b.Rating, b.ReviewCount, b.VerificationStatus, b.IsActive, b.CreatedAt,
           c.CategoryName
         FROM Businesses b
         LEFT JOIN BusinessCategories c ON b.CategoryId = c.CategoryId
         WHERE b.BusinessId = @businessId`,
        [{ name: 'businessId', type: mssql.BigInt(), value: numericId }]
      );

      if (result.recordset && result.recordset.length > 0) {
        return mapDbRowToBusiness(result.recordset[0]);
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query business by ID', { businessId, error: err.message });
    }

    return null;
  },

  async getMyBusinesses(ownerUserId: string): Promise<BusinessItem[]> {
    const numericOwnerId = parseInt(ownerUserId.replace(/\D/g, ''), 10);
    if (isNaN(numericOwnerId) || numericOwnerId <= 0) {
      return [];
    }

    try {
      const result = await databaseService.query<any>(
        `SELECT 
           b.BusinessId, b.OwnerUserId, b.CategoryId, b.BusinessName, b.Description, b.LogoUrl, b.CoverImageUrl,
           b.Phone, b.Email, b.Website, b.AddressLine1, b.AddressLine2, b.Area, b.City, b.State, b.Country,
           b.PostalCode, b.Rating, b.ReviewCount, b.VerificationStatus, b.IsActive, b.CreatedAt,
           c.CategoryName
         FROM Businesses b WITH (NOLOCK)
         LEFT JOIN BusinessCategories c WITH (NOLOCK) ON b.CategoryId = c.CategoryId
         WHERE b.OwnerUserId = @ownerId AND b.IsActive = 1
         ORDER BY b.BusinessId DESC`,
        [
          { name: 'ownerId', type: mssql.BigInt(), value: numericOwnerId },
        ]
      );

      return result.recordset.map(mapDbRowToBusiness);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query seller businesses', { ownerUserId, error: err.message });
      throw err;
    }
  },

  async createBusiness(ownerUserId: string, input: CreateBusinessInput): Promise<BusinessItem> {
    const numericOwnerId = parseInt(ownerUserId.replace(/\D/g, ''), 10);
    const isNumeric = !isNaN(numericOwnerId) && numericOwnerId > 0;

    if (!isNumeric) {
      throw new Error('Authoritative numeric owner ID required to create a business');
    }

    const effectiveName = (input.businessName || input.name || '').trim();
    if (!effectiveName) {
      throw new Error('Business name is required');
    }

    const effectiveType = (input.businessType || input.type || 'Shop').trim();
    const effectiveCategory = (
      input.restaurantCategory ||
      input.cafeCategory ||
      input.hotelCategory ||
      input.serviceCategory ||
      input.technicalCategory ||
      input.wholesaleCategory ||
      input.industry ||
      input.shopCategory ||
      input.category ||
      effectiveType
    ).trim();

    const effectiveLogo = (input.logoUrl || '').trim();
    const effectiveCover = (input.coverImageUrl || input.coverUrl || '').trim();
    const effectiveAddress = (input.addressLine1 || input.address || '').trim();
    const effectiveCity = (input.city || 'Chiplun').trim();
    const effectiveArea = (input.area || input.serviceArea || 'Central').trim();
    const effectiveUserDesc = (input.description || '').trim();

    // Compile type-specific configuration object
    const bizConfig: Record<string, any> = {
      businessType: effectiveType,
      category: effectiveCategory,
    };

    if (input.cuisines) bizConfig.cuisines = input.cuisines;
    if (input.serviceModes || input.services) bizConfig.serviceModes = input.serviceModes || input.services;
    if (input.amenities) bizConfig.amenities = input.amenities;
    if (input.averagePrice) bizConfig.averagePrice = input.averagePrice;
    if (input.starRating) bizConfig.starRating = input.starRating;
    if (input.checkInTime) bizConfig.checkInTime = input.checkInTime;
    if (input.checkOutTime) bizConfig.checkOutTime = input.checkOutTime;
    if (input.serviceArea) bizConfig.serviceArea = input.serviceArea;
    if (input.radius) bizConfig.radius = input.radius;
    if (input.pricingModel) bizConfig.pricingModel = input.pricingModel;
    if (input.workingDays) bizConfig.workingDays = input.workingDays;
    if (input.workingHours || input.openingHours) bizConfig.workingHours = input.workingHours || input.openingHours;
    if (input.experience) bizConfig.experience = input.experience;
    if (input.warehouseLocation) bizConfig.warehouseLocation = input.warehouseLocation;
    if (input.minOrderQuantity || input.moq) bizConfig.minOrderQuantity = input.minOrderQuantity || input.moq;
    if (input.bulkPricingSupported !== undefined) bizConfig.bulkPricingSupported = input.bulkPricingSupported;
    if (input.quotationSupported !== undefined) bizConfig.quotationSupported = input.quotationSupported;
    if (input.deliveryScope) bizConfig.deliveryScope = input.deliveryScope;
    if (input.companySize) bizConfig.companySize = input.companySize;
    if (input.attributes) Object.assign(bizConfig, input.attributes);

    const configTag = `<!--ECOSPHERE_BIZ_CONFIG:${JSON.stringify(bizConfig)}-->`;
    const effectiveDesc = effectiveUserDesc ? `${effectiveUserDesc}\n\n${configTag}` : configTag;

    let effectiveCategoryId = input.categoryId;
    if (!effectiveCategoryId) {
      effectiveCategoryId = resolveCategoryIdFromText(effectiveCategory, effectiveType);
    }
    if (!effectiveCategoryId || effectiveCategoryId <= 0) {
      effectiveCategoryId = 2; // Default to Retail
    }

    try {
      const result = await databaseService.query<any>(
        `INSERT INTO Businesses (
           OwnerUserId, CategoryId, BusinessName, Description, Phone, Email, Website,
           AddressLine1, Area, City, State, Country, PostalCode, LogoUrl, CoverImageUrl,
           VerificationStatus, Rating, ReviewCount, IsActive, CreatedAt
         )
         OUTPUT INSERTED.BusinessId
         VALUES (
           @ownerId, @categoryId, @name, @desc, @phone, @email, @web,
           @addr, @area, @city, @state, 'India', @postal, @logo, @cover,
           'APPROVED', 5.0, 0, 1, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'ownerId', type: mssql.BigInt(), value: numericOwnerId },
          { name: 'categoryId', type: mssql.Int(), value: effectiveCategoryId },
          { name: 'name', type: mssql.NVarChar(150), value: effectiveName },
          { name: 'desc', type: mssql.NVarChar(mssql.MAX), value: effectiveDesc },
          { name: 'phone', type: mssql.NVarChar(30), value: input.phone || '' },
          { name: 'email', type: mssql.NVarChar(100), value: input.email || '' },
          { name: 'web', type: mssql.NVarChar(255), value: input.website || '' },
          { name: 'addr', type: mssql.NVarChar(255), value: effectiveAddress },
          { name: 'area', type: mssql.NVarChar(100), value: effectiveArea },
          { name: 'city', type: mssql.NVarChar(100), value: effectiveCity },
          { name: 'state', type: mssql.NVarChar(100), value: input.state || 'Maharashtra' },
          { name: 'postal', type: mssql.NVarChar(20), value: input.postalCode || '' },
          { name: 'logo', type: mssql.NVarChar(500), value: effectiveLogo },
          { name: 'cover', type: mssql.NVarChar(500), value: effectiveCover },
        ]
      );

      const newId = String(result.recordset[0].BusinessId);
      const created = await this.getBusinessById(newId);
      if (!created) {
        throw new Error('Business created but failed to retrieve record');
      }
      return created;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to insert business', { ownerUserId, error: err.message });
      throw err;
    }
  },

  async updateBusiness(
    businessId: string,
    requestingUserId: string,
    isUserAdmin: boolean,
    input: UpdateBusinessInput
  ): Promise<BusinessItem> {
    const existing = await this.getBusinessById(businessId);
    if (!existing) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const numericReqUser = parseInt(requestingUserId.replace(/\D/g, ''), 10);
    const numericOwner = parseInt(existing.ownerUserId, 10);

    // Cross-seller security check
    if (!isUserAdmin && numericReqUser !== numericOwner) {
      throw new Error('FORBIDDEN_OWNERSHIP');
    }

    const numericBizId = parseInt(existing.id, 10);
    const updates: string[] = ['UpdatedAt = CURRENT_TIMESTAMP'];
    const params: Array<{ name: string; type: any; value: any }> = [
      { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
    ];

    const nameToUpdate = input.businessName ?? (input as any).name;
    if (nameToUpdate !== undefined) {
      updates.push('BusinessName = @bName');
      params.push({ name: 'bName', type: mssql.NVarChar(150), value: nameToUpdate });
    }
    if (input.description !== undefined) {
      updates.push('Description = @desc');
      params.push({ name: 'desc', type: mssql.NVarChar(mssql.MAX), value: input.description });
    }
    if (input.categoryId !== undefined) {
      updates.push('CategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: input.categoryId });
    }
    if (input.phone !== undefined) {
      updates.push('Phone = @phone');
      params.push({ name: 'phone', type: mssql.NVarChar(30), value: input.phone });
    }
    if (input.email !== undefined) {
      updates.push('Email = @email');
      params.push({ name: 'email', type: mssql.NVarChar(100), value: input.email });
    }
    const addressToUpdate = input.addressLine1 ?? (input as any).address;
    if (addressToUpdate !== undefined) {
      updates.push('AddressLine1 = @addr');
      params.push({ name: 'addr', type: mssql.NVarChar(255), value: addressToUpdate });
    }
    if (input.postalCode !== undefined) {
      updates.push('PostalCode = @postal');
      params.push({ name: 'postal', type: mssql.NVarChar(20), value: input.postalCode });
    }
    if (input.website !== undefined) {
      updates.push('Website = @web');
      params.push({ name: 'web', type: mssql.NVarChar(255), value: input.website });
    }
    if (input.area !== undefined) {
      updates.push('Area = @area');
      params.push({ name: 'area', type: mssql.NVarChar(100), value: input.area });
    }
    if (input.city !== undefined) {
      updates.push('City = @city');
      params.push({ name: 'city', type: mssql.NVarChar(100), value: input.city });
    }
    if (input.state !== undefined) {
      updates.push('State = @state');
      params.push({ name: 'state', type: mssql.NVarChar(100), value: input.state });
    }
    if (input.logoUrl !== undefined) {
      updates.push('LogoUrl = @logo');
      params.push({ name: 'logo', type: mssql.NVarChar(500), value: input.logoUrl });
    }
    const coverToUpdate = input.coverImageUrl ?? (input as any).coverUrl;
    if (coverToUpdate !== undefined) {
      updates.push('CoverImageUrl = @cover');
      params.push({ name: 'cover', type: mssql.NVarChar(500), value: coverToUpdate });
    }
    if ((input as any).isActive !== undefined) {
      updates.push('IsActive = @isActive');
      params.push({ name: 'isActive', type: mssql.Bit, value: (input as any).isActive ? 1 : 0 });
    }

    try {
      await databaseService.query(
        `UPDATE Businesses SET ${updates.join(', ')} WHERE BusinessId = @bizId`,
        params
      );

      const updated = await this.getBusinessById(businessId);
      if (!updated) {
        throw new Error('Business updated but failed to reload');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update business', { businessId, error: err.message });
      throw err;
    }
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; icon: string }>> {
    try {
      const result = await databaseService.query<any>(
        'SELECT CategoryId, CategoryName, Description, IconName FROM BusinessCategories WHERE IsActive = 1 ORDER BY CategoryId ASC'
      );
      return (result.recordset || []).map((row: any) => ({
        id: Number(row.CategoryId),
        name: row.CategoryName,
        description: row.Description || '',
        icon: row.IconName || 'Store',
      }));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to fetch business categories', { error: err.message });
      throw err;
    }
  },
};
