import { Business, Product, Order } from '../types';
import { apiClient } from './apiClient';
import { productService } from './productService';
import { orderService } from './orderService';

export interface BusinessQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  categoryId?: number;
}

export interface BusinessListResponse {
  success: boolean;
  businesses: Business[];
  total: number;
  page: number;
  totalPages: number;
}

export function normalizeBusiness(raw: any): Business {
  if (!raw) return raw;
  const name = raw.name || raw.businessName || 'Business';
  const logoUrl = raw.logoUrl || raw.logo || undefined;
  const coverUrl = raw.coverUrl || raw.coverImageUrl || undefined;
  const address = raw.address || raw.addressLine1 || '';
  const city = raw.city || raw.location?.city || 'Pune';
  const area = raw.area || raw.location?.area || 'Central';
  const businessType = raw.businessType || raw.type || raw.attributes?.businessType || 'Shop';
  return {
    ...raw,
    id: String(raw.id || raw.businessId),
    businessId: String(raw.id || raw.businessId),
    name,
    businessName: name,
    businessType,
    type: businessType,
    logoUrl,
    coverUrl,
    coverImageUrl: coverUrl,
    address,
    addressLine1: address,
    city,
    location: {
      city,
      area,
      ...(raw.location || {}),
    },
    category: raw.category || raw.categoryName || 'Retail',
  };
}

export const businessService = {
  /**
   * Fetch paginated real business list from backend GET /api/businesses
   */
  async getBusinesses(params?: BusinessQueryParams): Promise<Business[]> {
    try {
      const queryParts: string[] = [];
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
      if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get<any>(`/businesses${queryString}`, {
        requiresAuth: false,
      });

      const payload = response?.data || response;
      if (payload && (payload.businesses || Array.isArray(payload))) {
        const list = payload.businesses || payload;
        return list.map(normalizeBusiness);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[businessService.getBusinesses] Error:', error);
      }
    }
    return [];
  },

  /**
   * Fetch single business details from GET /api/businesses/:id
   */
  async getBusinessById(id: string): Promise<Business | undefined> {
    try {
      const response = await apiClient.get<any>(`/businesses/${id}`, {
        requiresAuth: false,
      });
      const payload = response?.data || response;
      if (payload && (payload.business || payload.id || payload.businessName)) {
        return normalizeBusiness(payload.business || payload);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[businessService.getBusinessById] Error fetching business ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Fetch authenticated seller's businesses from GET /api/businesses/mine
   */
  async getMyBusinesses(): Promise<Business[]> {
    try {
      const response = await apiClient.get<any>('/businesses/mine', {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.businesses || Array.isArray(payload))) {
        const list = payload.businesses || payload;
        return list.map(normalizeBusiness);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[businessService.getMyBusinesses] Failed to load seller businesses', error);
      }
    }
    return [];
  },

  /**
   * Create a new business on backend POST /api/businesses
   */
  async createBusiness(
    data: any
  ): Promise<Business> {
    const payload = {
      businessName: data.name || data.businessName,
      description: data.description || '',
      city: data.city || data.location?.city || 'Chiplun',
      addressLine1: data.address || data.addressLine1 || '',
      area: data.location?.area || data.area || 'Central',
      categoryId: data.categoryId || undefined,
      phone: data.phone || '',
      email: data.email || '',
      logoUrl: data.logoUrl || undefined,
      coverImageUrl: data.coverImageUrl || data.coverUrl || undefined,
      coverUrl: data.coverUrl || data.coverImageUrl || undefined,
      category: data.category || undefined,
      businessType: data.businessType || data.type || undefined,
      ...data,
    };
    const response = await apiClient.post<any>('/businesses', payload, {
      requiresAuth: true,
    });
    const resData = response?.data || response;
    if (resData && (resData.business || resData.id)) {
      return normalizeBusiness(resData.business || resData);
    }
    throw new Error('Failed to create business');
  },

  /**
   * Update existing business details on backend PUT /api/businesses/:id
   */
  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    const payload: any = { ...data };
    if (data.name) payload.businessName = data.name;
    if (data.address) payload.addressLine1 = data.address;
    if (data.coverUrl) payload.coverImageUrl = data.coverUrl;
    if (data.logoUrl) payload.logoUrl = data.logoUrl;

    const response = await apiClient.put<any>(`/businesses/${id}`, payload, {
      requiresAuth: true,
    });
    const resData = response?.data || response;
    if (resData && (resData.business || resData.id)) {
      return normalizeBusiness(resData.business || resData);
    }
    throw new Error('Failed to update business');
  },

  // Downstream modules (Products / Services / Orders) via live backend APIs
  async getProductsByBusiness(businessId: string): Promise<Product[]> {
    return await productService.getProducts({ businessId, limit: 100 });
  },

  async getAllProducts(): Promise<Product[]> {
    return await productService.getProducts({ limit: 100 });
  },

  async getOrders(): Promise<Order[]> {
    return await orderService.getSellerOrders();
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return await productService.createProduct(product as Partial<Product>);
  },

  async getCategories(): Promise<Array<{ id: number; name: string; description: string; icon: string }>> {
    try {
      const response = await apiClient.get<any>('/businesses/categories', { requiresAuth: false });
      const payload = response?.data || response;
      if (payload?.categories) {
        return payload.categories;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[businessService.getCategories] Error:', error);
      }
    }
    return [];
  },
};
