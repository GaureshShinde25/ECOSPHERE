import { apiClient } from './apiClient';

export type OpportunityType =
  | 'JOB'
  | 'GIG'
  | 'SERVICE'
  | 'BUSINESS'
  | 'DEMAND'
  | 'SKILL'
  | 'ASSET'
  | 'COLLABORATION';

export interface OpportunityItem {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  score: number;
  confidence: number;
  relevance: number;
  reason: string;
  sourceEntities: Array<{ entityType: string; entityId: string; name?: string }>;
  targetUserId?: string;
  location?: {
    city?: string;
    area?: string;
  };
  estimatedValue?: number;
  createdAt: string;
  expiresAt?: string;
  actionScreen?: string;
  actionParams?: Record<string, any>;
  businessName?: string;
  estimatedReturn?: string | number;
  metrics?: Record<string, any>;
  category?: string;
}

export const opportunityService = {
  async getOpportunities(options?: { type?: OpportunityType; city?: string; limit?: number }): Promise<OpportunityItem[]> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.city) params.append('city', options.city);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await apiClient.get<any>(`/opportunities?${params.toString()}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  },
};
