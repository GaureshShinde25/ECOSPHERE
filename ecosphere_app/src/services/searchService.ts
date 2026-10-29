import { apiClient } from './apiClient';

export interface SearchQueryParams {
  q?: string;
  type?: 'all' | 'business' | 'service' | 'product' | 'job';
  page?: number;
  limit?: number;
  city?: string;
  category?: string;
  categoryId?: number;
  businessId?: string;
  isAvailable?: boolean;
  jobType?: string;
  workMode?: string;
  status?: string;
}

export interface BusinessSearchItem {
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

export interface ServiceSearchItem {
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

export interface ProductSearchItem {
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

export interface JobSearchItem {
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
  success: boolean;
  businesses?: BusinessSearchItem[];
  services?: ServiceSearchItem[];
  products?: ProductSearchItem[];
  jobs?: JobSearchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: string;
  entityType?: string;
  entityId?: string;
  isTrending: boolean;
}

export interface SearchTag {
  id: string;
  tagName: string;
  tagType: string;
  usageCount: number;
}

export const searchService = {
  /**
   * Search unified API GET /api/search
   */
  async search(params?: SearchQueryParams): Promise<UnifiedSearchResponse> {
    try {
      const queryParts: string[] = [];
      if (params?.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
      if (params?.type) queryParts.push(`type=${params.type}`);
      if (params?.page) queryParts.push(`page=${params.page}`);
      if (params?.limit) queryParts.push(`limit=${params.limit}`);
      if (params?.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
      if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
      if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
      if (params?.businessId) queryParts.push(`businessId=${encodeURIComponent(params.businessId)}`);
      if (params?.jobType) queryParts.push(`jobType=${encodeURIComponent(params.jobType)}`);
      if (params?.workMode) queryParts.push(`workMode=${encodeURIComponent(params.workMode)}`);
      if (params?.isAvailable !== undefined) queryParts.push(`isAvailable=${params.isAvailable}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get<UnifiedSearchResponse>(`/search${queryString}`, {
        requiresAuth: false,
      });

      if (response && response.success) {
        return response;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[searchService.search] API error', error);
      }
    }

    return {
      success: false,
      businesses: [],
      services: [],
      products: [],
      jobs: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  },

  /**
   * Fetch autocomplete suggestions GET /api/search/suggestions
   */
  async getSuggestions(q?: string): Promise<SearchSuggestion[]> {
    try {
      const queryParam = q ? `?q=${encodeURIComponent(q)}` : '';
      const response = await apiClient.get<{ success: boolean; suggestions: SearchSuggestion[] }>(
        `/search/suggestions${queryParam}`,
        { requiresAuth: false }
      );
      if (response && response.success && Array.isArray(response.suggestions)) {
        return response.suggestions;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[searchService.getSuggestions] API error', error);
      }
    }
    return [];
  },

  /**
   * Fetch trending search tags GET /api/search/tags
   */
  async getSearchTags(): Promise<SearchTag[]> {
    try {
      const response = await apiClient.get<{ success: boolean; tags: SearchTag[] }>(
        `/search/tags`,
        { requiresAuth: false }
      );
      if (response && response.success && Array.isArray(response.tags)) {
        return response.tags;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[searchService.getSearchTags] API error', error);
      }
    }
    return [];
  },
};
