import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface GlobalSearchOptions {
  q?: string;
  type?: 'all' | 'business' | 'service' | 'product' | 'job';
  page?: number;
  limit?: number;
  city?: string;
  categoryId?: number;
  category?: string;
  businessId?: string;
  isAvailable?: boolean;
  jobType?: string;
  workMode?: string;
  status?: string;
}

export interface BusinessSearchResult {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  area?: string;
  city: string;
  state?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  categoryId?: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceSearchResult {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  categoryId?: number;
  imageUrl: string;
  city?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductSearchResult {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  categoryId?: number;
  imageUrl: string;
  brandName?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface JobSearchResult {
  id: string;
  employerUserId: string;
  businessId?: string;
  employerName: string;
  title: string;
  category: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  location: string;
  jobType: string;
  workMode: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface UnifiedSearchResponse {
  businesses?: BusinessSearchResult[];
  services?: ServiceSearchResult[];
  products?: ProductSearchResult[];
  jobs?: JobSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchSuggestionItem {
  id: string;
  text: string;
  type: string;
  entityType?: string;
  entityId?: string;
  isTrending: boolean;
}

export interface SearchTagItem {
  id: string;
  tagName: string;
  tagType: string;
  usageCount: number;
}

function sanitizeSearchQuery(q?: string): string {
  if (!q) return '';
  // Trim and clamp max length to 200 characters for safety
  return q.trim().substring(0, 200);
}

function mapDbRowToBusinessResult(row: any): BusinessSearchResult {
  return {
    id: String(row.BusinessId),
    ownerUserId: String(row.OwnerUserId),
    name: row.BusinessName,
    description: row.Description || '',
    logoUrl: row.LogoUrl || undefined,
    coverUrl: row.CoverImageUrl || undefined,
    area: row.Area || row.City || 'Central',
    city: row.City || 'Pune',
    state: row.State || 'Maharashtra',
    rating: row.Rating ? Number(row.Rating) : 4.5,
    reviewCount: row.ReviewCount ? Number(row.ReviewCount) : 0,
    verified: row.VerificationStatus === 'APPROVED',
    categoryId: row.CategoryId ? Number(row.CategoryId) : undefined,
    category: row.CategoryName || 'Local Business',
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapDbRowToServiceResult(row: any): ServiceSearchResult {
  return {
    id: String(row.ServiceId),
    businessId: String(row.BusinessId || '1'),
    businessName: row.BusinessName || 'ECOSPHERE Service Provider',
    title: row.ServiceName,
    description: row.Description || '',
    price: row.Price ? Number(row.Price) : 499,
    durationMinutes: row.DurationMinutes ? Number(row.DurationMinutes) : 60,
    category: row.CategoryName || 'Home Services',
    categoryId: row.ServiceCategoryId ? Number(row.ServiceCategoryId) : undefined,
    imageUrl: row.ServiceImageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    city: row.City || 'Pune',
    isAvailable: Boolean(row.IsAvailable),
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapDbRowToProductResult(row: any): ProductSearchResult {
  const price = row.Price ? Number(row.Price) : 499;
  const discountPrice = row.DiscountPrice ? Number(row.DiscountPrice) : undefined;
  const stock = row.StockQuantity !== null && row.StockQuantity !== undefined ? Number(row.StockQuantity) : 50;

  return {
    id: String(row.ProductId),
    businessId: String(row.BusinessId || '1'),
    businessName: row.BusinessName || 'ECOSPHERE Merchant',
    title: row.ProductName,
    description: row.Description || '',
    price: discountPrice || price,
    stockQuantity: stock,
    category: row.CategoryName || 'General Goods',
    categoryId: row.ProductCategoryId ? Number(row.ProductCategoryId) : undefined,
    imageUrl: row.ProductImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    brandName: row.BrandName || undefined,
    isAvailable: Boolean(row.IsAvailable) && stock > 0,
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapDbRowToJobResult(row: any): JobSearchResult {
  const empName = row.BusinessName || `${row.EmployerFirstName || ''} ${row.EmployerLastName || ''}`.trim() || 'ECOSPHERE Partner';

  return {
    id: String(row.JobId),
    employerUserId: String(row.EmployerUserId),
    businessId: row.BusinessId ? String(row.BusinessId) : undefined,
    employerName: empName,
    title: row.JobTitle || 'Position',
    category: row.CategoryName || 'Employment',
    description: row.Description || '',
    salaryMin: row.SalaryMin ? Number(row.SalaryMin) : undefined,
    salaryMax: row.SalaryMax ? Number(row.SalaryMax) : undefined,
    salaryPeriod: row.SalaryPeriod || 'MONTHLY',
    location: row.City ? `${row.City}, ${row.State || ''}`.trim() : 'Pune, Maharashtra',
    jobType: row.JobType || 'FULL_TIME',
    workMode: row.WorkMode || 'ON_SITE',
    status: row.Status || 'OPEN',
    isActive: Boolean(row.IsActive),
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

export const searchService = {
  /**
   * Primary search execution supporting all or specific entity types
   */
  async search(options: GlobalSearchOptions): Promise<UnifiedSearchResponse> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const queryStr = sanitizeSearchQuery(options.q);
    const entityType = options.type || 'all';

    // Record search query in SearchSuggestions table asynchronously (if non-empty)
    if (queryStr.length >= 2) {
      this.recordSearchTerm(queryStr).catch((err) =>
        logger.warn('Failed to record search term in SearchSuggestions', { error: err.message })
      );
    }

    if (entityType === 'business') {
      return this.searchBusinesses(queryStr, options, page, limit, offset);
    }
    if (entityType === 'service') {
      return this.searchServices(queryStr, options, page, limit, offset);
    }
    if (entityType === 'product') {
      return this.searchProducts(queryStr, options, page, limit, offset);
    }
    if (entityType === 'job') {
      return this.searchJobs(queryStr, options, page, limit, offset);
    }

    // Default: 'all' (Categorized results)
    const perCategoryLimit = Math.max(1, Math.floor(limit / 4)) || 5;

    const [bizRes, srvRes, prodRes, jobRes] = await Promise.all([
      this.searchBusinesses(queryStr, options, 1, perCategoryLimit, 0),
      this.searchServices(queryStr, options, 1, perCategoryLimit, 0),
      this.searchProducts(queryStr, options, 1, perCategoryLimit, 0),
      this.searchJobs(queryStr, options, 1, perCategoryLimit, 0),
    ]);

    const totalCount = bizRes.total + srvRes.total + prodRes.total + jobRes.total;

    return {
      businesses: bizRes.businesses,
      services: srvRes.services,
      products: prodRes.products,
      jobs: jobRes.jobs,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  },

  /**
   * Search Businesses with SQL Server OFFSET/FETCH pagination
   */
  async searchBusinesses(
    queryStr: string,
    options: GlobalSearchOptions,
    page: number,
    limit: number,
    offset: number
  ): Promise<UnifiedSearchResponse> {
    const conditions: string[] = ['b.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (queryStr) {
      conditions.push('(b.BusinessName LIKE @search OR b.Description LIKE @search OR b.Area LIKE @search OR b.City LIKE @search OR c.CategoryName LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(200), value: `%${queryStr}%` });
    }

    if (options.city && options.city.trim()) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city.trim()}%` });
    }

    if (options.categoryId && options.categoryId > 0) {
      conditions.push('b.CategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: options.categoryId });
    } else if (options.category && options.category.trim()) {
      conditions.push('c.CategoryName LIKE @catName');
      params.push({ name: 'catName', type: mssql.NVarChar(100), value: `%${options.category.trim()}%` });
    }

    const whereSql = conditions.join(' AND ');

    try {
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Businesses b WITH (NOLOCK)
         LEFT JOIN BusinessCategories c WITH (NOLOCK) ON b.CategoryId = c.CategoryId
         WHERE ${whereSql}`,
        params
      );
      const total = countRes.recordset[0]?.total || 0;

      const pageParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataRes = await databaseService.query<any>(
        `SELECT 
           b.BusinessId, b.OwnerUserId, b.CategoryId, b.BusinessName, b.Description,
           b.LogoUrl, b.CoverImageUrl, b.Area, b.City, b.State, b.Rating, b.ReviewCount,
           b.VerificationStatus, b.IsActive, b.CreatedAt,
           c.CategoryName
         FROM Businesses b WITH (NOLOCK)
         LEFT JOIN BusinessCategories c WITH (NOLOCK) ON b.CategoryId = c.CategoryId
         WHERE ${whereSql}
         ORDER BY b.Rating DESC, b.BusinessId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const businesses = dataRes.recordset.map(mapDbRowToBusinessResult);
      return {
        businesses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed executing business search', { queryStr, error: err.message });
      throw err;
    }
  },

  /**
   * Search Services with SQL Server OFFSET/FETCH pagination
   */
  async searchServices(
    queryStr: string,
    options: GlobalSearchOptions,
    page: number,
    limit: number,
    offset: number
  ): Promise<UnifiedSearchResponse> {
    const conditions: string[] = ['s.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (queryStr) {
      conditions.push('(s.ServiceName LIKE @search OR s.Description LIKE @search OR c.CategoryName LIKE @search OR b.BusinessName LIKE @search OR b.City LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(200), value: `%${queryStr}%` });
    }

    if (options.city && options.city.trim()) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city.trim()}%` });
    }

    if (options.categoryId && options.categoryId > 0) {
      conditions.push('s.ServiceCategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: options.categoryId });
    } else if (options.category && options.category.trim()) {
      conditions.push('c.CategoryName LIKE @catName');
      params.push({ name: 'catName', type: mssql.NVarChar(100), value: `%${options.category.trim()}%` });
    }

    if (options.isAvailable !== undefined) {
      conditions.push('s.IsAvailable = @avail');
      params.push({ name: 'avail', type: mssql.Bit(), value: options.isAvailable ? 1 : 0 });
    }

    const whereSql = conditions.join(' AND ');

    try {
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Services s WITH (NOLOCK)
         LEFT JOIN ServiceCategories c WITH (NOLOCK) ON s.ServiceCategoryId = c.ServiceCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
         WHERE ${whereSql}`,
        params
      );
      const total = countRes.recordset[0]?.total || 0;

      const pageParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataRes = await databaseService.query<any>(
        `SELECT 
           s.ServiceId, s.BusinessId, s.ServiceCategoryId, s.ServiceName, s.Description,
           s.Price, s.DurationMinutes, s.ServiceImageUrl, s.IsAvailable, s.IsActive, s.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City
         FROM Services s WITH (NOLOCK)
         LEFT JOIN ServiceCategories c WITH (NOLOCK) ON s.ServiceCategoryId = c.ServiceCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
         WHERE ${whereSql}
         ORDER BY s.ServiceId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const services = dataRes.recordset.map(mapDbRowToServiceResult);
      return {
        services,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed executing service search', { queryStr, error: err.message });
      throw err;
    }
  },

  /**
   * Search Products with SQL Server OFFSET/FETCH pagination
   */
  async searchProducts(
    queryStr: string,
    options: GlobalSearchOptions,
    page: number,
    limit: number,
    offset: number
  ): Promise<UnifiedSearchResponse> {
    const conditions: string[] = ['p.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (queryStr) {
      conditions.push('(p.ProductName LIKE @search OR p.Description LIKE @search OR p.BrandName LIKE @search OR c.CategoryName LIKE @search OR b.BusinessName LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(200), value: `%${queryStr}%` });
    }

    if (options.city && options.city.trim()) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city.trim()}%` });
    }

    if (options.categoryId && options.categoryId > 0) {
      conditions.push('p.ProductCategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: options.categoryId });
    } else if (options.category && options.category.trim()) {
      conditions.push('c.CategoryName LIKE @catName');
      params.push({ name: 'catName', type: mssql.NVarChar(100), value: `%${options.category.trim()}%` });
    }

    if (options.businessId) {
      const numBiz = parseInt(options.businessId.replace(/\D/g, ''), 10);
      if (!isNaN(numBiz) && numBiz > 0) {
        conditions.push('p.BusinessId = @bizId');
        params.push({ name: 'bizId', type: mssql.BigInt(), value: numBiz });
      }
    }

    if (options.isAvailable !== undefined) {
      conditions.push('p.IsAvailable = @avail');
      params.push({ name: 'avail', type: mssql.Bit(), value: options.isAvailable ? 1 : 0 });
    }

    const whereSql = conditions.join(' AND ');

    try {
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Products p WITH (NOLOCK)
         LEFT JOIN ProductCategories c WITH (NOLOCK) ON p.ProductCategoryId = c.ProductCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
         WHERE ${whereSql}`,
        params
      );
      const total = countRes.recordset[0]?.total || 0;

      const pageParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataRes = await databaseService.query<any>(
        `SELECT 
           p.ProductId, p.BusinessId, p.ProductCategoryId, p.ProductName, p.Description,
           p.Price, p.DiscountPrice, p.StockQuantity, p.ProductImageUrl, p.BrandName,
           p.IsAvailable, p.IsActive, p.CreatedAt,
           c.CategoryName,
           b.BusinessName
         FROM Products p WITH (NOLOCK)
         LEFT JOIN ProductCategories c WITH (NOLOCK) ON p.ProductCategoryId = c.ProductCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
         WHERE ${whereSql}
         ORDER BY p.ProductId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const products = dataRes.recordset.map(mapDbRowToProductResult);
      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed executing product search', { queryStr, error: err.message });
      throw err;
    }
  },

  /**
   * Search Jobs with SQL Server OFFSET/FETCH pagination
   */
  async searchJobs(
    queryStr: string,
    options: GlobalSearchOptions,
    page: number,
    limit: number,
    offset: number
  ): Promise<UnifiedSearchResponse> {
    const conditions: string[] = ['j.IsActive = 1'];
    const params: Array<{ name: string; type: any; value: any }> = [];

    if (options.status) {
      conditions.push('j.Status = @status');
      params.push({ name: 'status', type: mssql.VarChar(30), value: options.status.toUpperCase() });
    } else {
      conditions.push("j.Status = 'OPEN'");
    }

    if (queryStr) {
      conditions.push('(j.JobTitle LIKE @search OR j.Description LIKE @search OR j.Qualification LIKE @search OR b.BusinessName LIKE @search OR b.City LIKE @search OR c.CategoryName LIKE @search)');
      params.push({ name: 'search', type: mssql.NVarChar(200), value: `%${queryStr}%` });
    }

    if (options.city && options.city.trim()) {
      conditions.push('b.City LIKE @city');
      params.push({ name: 'city', type: mssql.NVarChar(50), value: `%${options.city.trim()}%` });
    }

    if (options.categoryId && options.categoryId > 0) {
      conditions.push('j.JobCategoryId = @catId');
      params.push({ name: 'catId', type: mssql.Int(), value: options.categoryId });
    } else if (options.category && options.category.trim()) {
      conditions.push('c.CategoryName LIKE @catName');
      params.push({ name: 'catName', type: mssql.NVarChar(100), value: `%${options.category.trim()}%` });
    }

    if (options.jobType && options.jobType.trim()) {
      conditions.push('j.JobType = @jType');
      params.push({ name: 'jType', type: mssql.VarChar(50), value: options.jobType.trim().toUpperCase().replace('-', '_') });
    }

    if (options.workMode && options.workMode.trim()) {
      conditions.push('j.WorkMode = @wMode');
      params.push({ name: 'wMode', type: mssql.VarChar(30), value: options.workMode.trim().toUpperCase().replace('-', '_') });
    }

    const whereSql = conditions.join(' AND ');

    try {
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS total 
         FROM Jobs j WITH (NOLOCK)
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         WHERE ${whereSql}`,
        params
      );
      const total = countRes.recordset[0]?.total || 0;

      const pageParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const dataRes = await databaseService.query<any>(
        `SELECT 
           j.JobId, j.EmployerUserId, j.BusinessId, j.JobCategoryId, j.JobTitle, j.Description,
           j.JobType, j.WorkMode, j.SalaryMin, j.SalaryMax, j.SalaryPeriod, j.Status, j.IsActive, j.CreatedAt,
           c.CategoryName,
           b.BusinessName, b.City, b.State,
           u.FirstName AS EmployerFirstName, u.LastName AS EmployerLastName
         FROM Jobs j WITH (NOLOCK)
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         LEFT JOIN Users u WITH (NOLOCK) ON j.EmployerUserId = u.UserId
         WHERE ${whereSql}
         ORDER BY j.JobId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const jobs = dataRes.recordset.map(mapDbRowToJobResult);
      return {
        jobs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed executing job search', { queryStr, error: err.message });
      throw err;
    }
  },

  /**
   * Retrieve search suggestions using SearchSuggestions table + entity categories
   */
  async getSuggestions(q?: string): Promise<SearchSuggestionItem[]> {
    const cleanQ = sanitizeSearchQuery(q);
    if (!cleanQ) {
      // Return top trending suggestions if query is empty
      const defaultRes = await databaseService.query<any>(
        `SELECT TOP 10 SearchSuggestionId, SuggestionText, SuggestionType, EntityType, EntityId, IsTrending
         FROM SearchSuggestions WITH (NOLOCK)
         WHERE IsActive = 1
         ORDER BY IsTrending DESC, SearchCount DESC, SearchSuggestionId ASC`
      );
      return defaultRes.recordset.map((r: any) => ({
        id: String(r.SearchSuggestionId),
        text: r.SuggestionText,
        type: r.SuggestionType || 'query',
        entityType: r.EntityType || undefined,
        entityId: r.EntityId ? String(r.EntityId) : undefined,
        isTrending: Boolean(r.IsTrending),
      }));
    }

    try {
      const suggestionRes = await databaseService.query<any>(
        `SELECT TOP 10 SearchSuggestionId, SuggestionText, SuggestionType, EntityType, EntityId, IsTrending
         FROM SearchSuggestions WITH (NOLOCK)
         WHERE IsActive = 1 AND (SuggestionText LIKE @pattern OR NormalizedText LIKE @pattern)
         ORDER BY SearchCount DESC, SearchSuggestionId ASC`,
        [{ name: 'pattern', type: mssql.NVarChar(200), value: `%${cleanQ}%` }]
      );

      const items: SearchSuggestionItem[] = suggestionRes.recordset.map((r: any) => ({
        id: String(r.SearchSuggestionId),
        text: r.SuggestionText,
        type: r.SuggestionType || 'query',
        entityType: r.EntityType || undefined,
        entityId: r.EntityId ? String(r.EntityId) : undefined,
        isTrending: Boolean(r.IsTrending),
      }));

      // Supplement with matching categories if fewer than 5 suggestions
      if (items.length < 5) {
        const catRes = await databaseService.query<any>(
          `SELECT TOP 5 CategoryName FROM BusinessCategories WHERE CategoryName LIKE @pattern AND IsActive = 1
           UNION
           SELECT TOP 5 CategoryName FROM ServiceCategories WHERE CategoryName LIKE @pattern AND IsActive = 1
           UNION
           SELECT TOP 5 CategoryName FROM ProductCategories WHERE CategoryName LIKE @pattern AND IsActive = 1
           UNION
           SELECT TOP 5 CategoryName FROM JobCategories WHERE CategoryName LIKE @pattern AND IsActive = 1`,
          [{ name: 'pattern', type: mssql.NVarChar(200), value: `%${cleanQ}%` }]
        );

        for (const catRow of catRes.recordset) {
          if (!items.some((i) => i.text.toLowerCase() === catRow.CategoryName.toLowerCase())) {
            items.push({
              id: `cat_${items.length + 1}`,
              text: catRow.CategoryName,
              type: 'category',
              isTrending: false,
            });
          }
        }
      }

      return items;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching search suggestions', { query: cleanQ, error: err.message });
      return [];
    }
  },

  /**
   * Retrieve active search tags from SearchTags table
   */
  async getSearchTags(): Promise<SearchTagItem[]> {
    try {
      const result = await databaseService.query<any>(
        `SELECT SearchTagId, TagName, TagType, UsageCount
         FROM SearchTags WITH (NOLOCK)
         WHERE IsActive = 1
         ORDER BY UsageCount DESC, SearchTagId ASC`
      );

      return result.recordset.map((r: any) => ({
        id: String(r.SearchTagId),
        tagName: r.TagName,
        tagType: r.TagType || 'general',
        usageCount: Number(r.UsageCount || 0),
      }));
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching search tags', { error: err.message });
      return [];
    }
  },

  /**
   * Helper to safely update/insert SearchSuggestions count
   */
  async recordSearchTerm(term: string): Promise<void> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return;

    try {
      const existing = await databaseService.query<any>(
        `SELECT TOP 1 SearchSuggestionId FROM SearchSuggestions WHERE NormalizedText = @norm`,
        [{ name: 'norm', type: mssql.NVarChar(500), value: normalized }]
      );

      if (existing.recordset && existing.recordset.length > 0) {
        await databaseService.query(
          `UPDATE SearchSuggestions SET SearchCount = SearchCount + 1, UpdatedAt = CURRENT_TIMESTAMP WHERE SearchSuggestionId = @id`,
          [{ name: 'id', type: mssql.BigInt(), value: existing.recordset[0].SearchSuggestionId }]
        );
      } else {
        await databaseService.query(
          `INSERT INTO SearchSuggestions (SuggestionText, NormalizedText, SuggestionType, SearchCount, ClickCount, IsTrending, IsActive, CreatedAt)
           VALUES (@text, @norm, 'query', 1, 0, 0, 1, CURRENT_TIMESTAMP)`,
          [
            { name: 'text', type: mssql.NVarChar(500), value: term.trim() },
            { name: 'norm', type: mssql.NVarChar(500), value: normalized },
          ]
        );
      }
    } catch (error) {
      // Non-critical, ignore write errors silently
    }
  },
};
