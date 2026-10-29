import { apiClient } from './apiClient';

export type FeedbackConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_EVIDENCE';

export interface JobOutcomeFeedback {
  categoryName: string;
  applicationCount: number;
  shortlistedCount: number;
  rejectedCount: number;
  underReviewCount: number;
  submittedCount: number;
  shortlistRate: number;
  outcomeScore: number;
  boost: number;
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface ServiceOutcomeFeedback {
  categoryName: string;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  confirmedCount: number;
  fulfillmentRate: number;
  cancellationRate: number;
  outcomeScore: number;
  boost: number;
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface RetailOutcomeFeedback {
  categoryName: string;
  orderCount: number;
  deliveredCount: number;
  cancelledCount: number;
  shippedCount: number;
  processingCount: number;
  deliveryRate: number;
  cancellationRate: number;
  outcomeScore: number;
  boost: number;
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface FeedbackSummary {
  city: string;
  totalApplications: number;
  totalShortlisted: number;
  globalShortlistRate: number;
  totalBookings: number;
  totalCompletedBookings: number;
  globalFulfillmentRate: number;
  totalOrders: number;
  totalDeliveredOrders: number;
  globalDeliveryRate: number;
  averageBoost: number;
  evidenceStrength: 'STRONG' | 'MODERATE' | 'SPARSE';
  dataDepthNote: string;
  observedSignalsCount: number;
}

export interface CategoryDetailFeedback {
  categoryName: string;
  city: string;
  jobOutcome: JobOutcomeFeedback | null;
  serviceOutcome: ServiceOutcomeFeedback | null;
  retailOutcome: RetailOutcomeFeedback | null;
  blendedBoost: number;
  overallConfidence: FeedbackConfidence;
  summary: string;
}

export const feedbackService = {
  async getSummary(city?: string): Promise<FeedbackSummary | null> {
    try {
      const url = city ? `/feedback/summary?city=${encodeURIComponent(city)}` : '/feedback/summary';
      const response = await apiClient.get<any>(url);
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch feedback summary:', err);
      return null;
    }
  },

  async getCategories(city?: string): Promise<{
    city: string;
    jobs: JobOutcomeFeedback[];
    services: ServiceOutcomeFeedback[];
    retail: RetailOutcomeFeedback[];
  } | null> {
    try {
      const url = city ? `/feedback/categories?city=${encodeURIComponent(city)}` : '/feedback/categories';
      const response = await apiClient.get<any>(url);
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch category feedback:', err);
      return null;
    }
  },

  async getServices(city?: string): Promise<ServiceOutcomeFeedback[]> {
    try {
      const url = city ? `/feedback/services?city=${encodeURIComponent(city)}` : '/feedback/services';
      const response = await apiClient.get<any>(url);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch service feedback:', err);
      return [];
    }
  },

  async getJobs(city?: string): Promise<JobOutcomeFeedback[]> {
    try {
      const url = city ? `/feedback/jobs?city=${encodeURIComponent(city)}` : '/feedback/jobs';
      const response = await apiClient.get<any>(url);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Failed to fetch job feedback:', err);
      return [];
    }
  },

  async getCategoryDetail(category: string, city?: string): Promise<CategoryDetailFeedback | null> {
    try {
      const query = city ? `?city=${encodeURIComponent(city)}` : '';
      const response = await apiClient.get<any>(`/feedback/${encodeURIComponent(category)}${query}`);
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch category detail feedback:', err);
      return null;
    }
  },
};
