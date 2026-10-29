import { apiClient } from './apiClient';
import { OpportunityItem, OpportunityType } from './opportunityService';

export interface PersonalizedRecommendationItem {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  confidenceScore?: number;
  reason?: string;
  opportunity: OpportunityItem;
  recommendationScore: number;
  matchQuality: 'Strong Match' | 'Good Match' | 'Local Match';
  reasons: string[];
  feedbackEvidence?: {
    boost: number;
    outcomeScore: number;
    confidence: string;
    sampleSize: number;
    observedOutcome: string;
    evidenceCategory: string;
    geographicScope: string;
    metricName: string;
    metricValue: number;
    evidenceType: string;
    reason: string;
  };
  feedbackBoost?: number;
}

export const recommendationService = {
  async getRecommendations(options?: { type?: OpportunityType; city?: string; limit?: number }): Promise<PersonalizedRecommendationItem[]> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.city) params.append('city', options.city);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await apiClient.get<any>(`/recommendations?${params.toString()}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      return [];
    }
  },
};
