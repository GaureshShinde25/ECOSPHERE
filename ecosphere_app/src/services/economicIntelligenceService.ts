import { apiClient } from './apiClient';

export type InsightType =
  | 'SUPPLY_GAP'
  | 'EMERGING_DEMAND'
  | 'HIRING_DEMAND'
  | 'ACTIVE_MARKET'
  | 'LOW_ACTIVITY';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EconomicInsightItem {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  category: string;
  location: { city: string };
  confidence: ConfidenceLevel;
  evidence: {
    demandCount: number;
    supplyCount: number;
    totalVolume?: number;
    category: string;
    city: string;
    ratio?: number;
  };
  generatedAt: string;
}

export const economicIntelligenceService = {
  async getEconomicInsights(options?: { city?: string; category?: string; type?: InsightType; limit?: number }): Promise<EconomicInsightItem[]> {
    try {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.category) params.append('category', options.category);
      if (options?.type) params.append('type', options.type);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await apiClient.get<any>(`/economic-intelligence?${params.toString()}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching economic intelligence insights:', error);
      return [];
    }
  },
};
