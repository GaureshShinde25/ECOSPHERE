import { apiClient } from './apiClient';

export interface ReviewItem {
  id: string;
  userId: string;
  reviewerName: string;
  targetType: string;
  targetId: string;
  rating: number;
  title?: string;
  reviewText?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetReviewsResponse {
  success: boolean;
  reviews: ReviewItem[];
  total: number;
  averageRating: number;
  ratingDistribution: { [star: number]: number };
}

export interface CreateReviewData {
  targetType: 'Business' | 'Service' | 'Product' | 'Order' | string;
  targetId: string | number;
  rating: number;
  title?: string;
  reviewText?: string;
}

export const reviewService = {
  /**
   * Fetch reviews with optional targetType, targetId, userId filters
   */
  async getReviews(
    params: { targetType?: string; targetId?: string | number; userId?: string | number; page?: number; limit?: number } = {}
  ): Promise<{ reviews: ReviewItem[]; total: number; averageRating: number; ratingDistribution: { [star: number]: number } }> {
    try {
      const queryParts: string[] = [];
      if (params.targetType) queryParts.push(`targetType=${encodeURIComponent(params.targetType)}`);
      if (params.targetId) queryParts.push(`targetId=${encodeURIComponent(String(params.targetId))}`);
      if (params.userId) queryParts.push(`userId=${encodeURIComponent(String(params.userId))}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get<GetReviewsResponse>(`/reviews${queryString}`, { requiresAuth: false });

      if (response && response.reviews && Array.isArray(response.reviews)) {
        return {
          reviews: response.reviews,
          total: response.total || response.reviews.length,
          averageRating: response.averageRating || 0,
          ratingDistribution: response.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[reviewService.getReviews] Error fetching reviews', error);
      }
    }
    return { reviews: [], total: 0, averageRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  },

  /**
   * Fetch my submitted reviews
   */
  async getMyReviews(): Promise<ReviewItem[]> {
    try {
      const response = await apiClient.get<{ success: boolean; reviews: ReviewItem[] }>('/reviews/mine', { requiresAuth: true });
      if (response && response.reviews && Array.isArray(response.reviews)) {
        return response.reviews;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[reviewService.getMyReviews] Error fetching user reviews', error);
      }
    }
    return [];
  },

  /**
   * Fetch single review detail by ID
   */
  async getReviewById(id: string): Promise<ReviewItem | undefined> {
    try {
      const response = await apiClient.get<{ success: boolean; review: ReviewItem }>(`/reviews/${id}`, { requiresAuth: false });
      if (response && response.review) {
        return response.review;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[reviewService.getReviewById] Error fetching review ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Submit a new review
   */
  async createReview(data: CreateReviewData): Promise<ReviewItem> {
    const response = await apiClient.post<{ success: boolean; message: string; review: ReviewItem }>('/reviews', data, {
      requiresAuth: true,
    });
    if (response && response.review) {
      return response.review;
    }
    throw new Error('Failed to publish review');
  },

  /**
   * Update existing review
   */
  async updateReview(id: string, data: { rating?: number; title?: string; reviewText?: string }): Promise<ReviewItem> {
    const response = await apiClient.put<{ success: boolean; message: string; review: ReviewItem }>(`/reviews/${id}`, data, {
      requiresAuth: true,
    });
    if (response && response.review) {
      return response.review;
    }
    throw new Error('Failed to update review');
  },

  /**
   * Delete review
   */
  async deleteReview(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/reviews/${id}`, { requiresAuth: true });
    return Boolean(response && response.success);
  },
};
