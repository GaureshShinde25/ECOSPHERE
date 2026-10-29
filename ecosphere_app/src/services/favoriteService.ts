import { apiClient } from './apiClient';

export interface SavedServiceItem {
  id?: string;
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

export interface SavedProductItem {
  id?: string;
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

export interface SavedJobItem {
  id?: string;
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

export interface SavedBusinessItem {
  id?: string;
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

export interface UserFavoritesData {
  services: SavedServiceItem[];
  products: SavedProductItem[];
  jobs: SavedJobItem[];
  businesses: SavedBusinessItem[];
  total: number;
}

export const favoriteService = {
  /**
   * Fetch authenticated user's saved items GET /api/favorites
   */
  async getFavorites(): Promise<UserFavoritesData> {
    try {
      const response = await apiClient.get<UserFavoritesData & { success: boolean }>('/favorites', {
        requiresAuth: true,
      });

      if (response && response.success) {
        return {
          services: response.services || [],
          products: response.products || [],
          jobs: response.jobs || [],
          businesses: response.businesses || [],
          total: response.total || 0,
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[favoriteService.getFavorites] Failed to fetch favorites', error);
      }
    }

    return { services: [], products: [], jobs: [], businesses: [], total: 0 };
  },

  /**
   * Check if a specific entity is saved GET /api/favorites/:type/:id
   */
  async isFavorite(entityType: 'service' | 'product' | 'job' | 'business', entityId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ success: boolean; isFavorite: boolean }>(
        `/favorites/${entityType}/${entityId}`,
        { requiresAuth: true }
      );
      return Boolean(response && response.isFavorite);
    } catch (error) {
      return false;
    }
  },

  /**
   * Add item to favorites POST /api/favorites
   */
  async addFavorite(entityType: 'service' | 'product' | 'job' | 'business', entityId: string): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean; isFavorite: boolean }>('/favorites', {
      entityType,
      entityId,
    }, { requiresAuth: true });
    return Boolean(response && response.success);
  },

  /**
   * Remove item from favorites DELETE /api/favorites/:type/:id
   */
  async removeFavorite(entityType: 'service' | 'product' | 'job' | 'business', entityId: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>('/favorites/' + entityType + '/' + entityId, {
      requiresAuth: true,
    });
    return Boolean(response && response.success);
  },

  /**
   * Toggle favorite state based on current status
   */
  async toggleFavorite(
    entityType: 'service' | 'product' | 'job' | 'business',
    entityId: string,
    currentlyFavorite: boolean
  ): Promise<boolean> {
    if (currentlyFavorite) {
      await this.removeFavorite(entityType, entityId);
      return false;
    } else {
      await this.addFavorite(entityType, entityId);
      return true;
    }
  },
};
