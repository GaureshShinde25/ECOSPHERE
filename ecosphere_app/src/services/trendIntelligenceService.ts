import { apiClient } from './apiClient';

export interface TrendEvidenceItem {
  metric: string;
  value: string | number;
  timeWindow: string;
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TrendLimitationItem {
  code: string;
  description: string;
  severity: 'WARNING' | 'INFO';
}

export interface CategoryTrendItem {
  category: string;
  currentDemand: number;
  previousDemand: number;
  change: number;
  growthPercent: number;
  direction: 'INCREASING' | 'STABLE' | 'DECLINING';
  classification: 'EMERGING_DEMAND' | 'DECLINING_DEMAND' | 'STABLE_DEMAND' | 'HIGH_MOMENTUM';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: TrendEvidenceItem[];
  limitations: TrendLimitationItem[];
}

export interface WeeklyActivityPatternResult {
  busiestDay: string;
  lowestActivityDay: string;
  distribution: Array<{ day: string; bookingCount: number; percentage: number }>;
  timeWindow: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface OpportunityMomentumResult {
  opportunityId: string;
  title: string;
  currentScore: number;
  wowGrowthPercent: number;
  momentumScore: number | 'MOMENTUM_UNAVAILABLE';
  status: 'HIGH_MOMENTUM' | 'STABLE_MOMENTUM' | 'MOMENTUM_UNAVAILABLE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: TrendEvidenceItem[];
}

export const trendIntelligenceService = {
  async getCategoryTrends(city: string = 'Kolkata'): Promise<CategoryTrendItem[]> {
    try {
      const response = await apiClient.get<any>(`/trends/categories?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.trends) ? data.trends : [];
    } catch (error) {
      console.error('Error fetching category trends:', error);
      return [];
    }
  },

  async getEmergingDemand(city: string = 'Kolkata'): Promise<CategoryTrendItem[]> {
    try {
      const response = await apiClient.get<any>(`/trends/emerging?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.emerging) ? data.emerging : [];
    } catch (error) {
      console.error('Error fetching emerging demand:', error);
      return [];
    }
  },

  async getDecliningDemand(city: string = 'Kolkata'): Promise<CategoryTrendItem[]> {
    try {
      const response = await apiClient.get<any>(`/trends/declining?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.declining) ? data.declining : [];
    } catch (error) {
      console.error('Error fetching declining demand:', error);
      return [];
    }
  },

  async getWeeklyPatterns(city: string = 'Kolkata'): Promise<WeeklyActivityPatternResult | null> {
    try {
      const response = await apiClient.get<any>(`/trends/patterns?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return data?.patterns || null;
    } catch (error) {
      console.error('Error fetching weekly patterns:', error);
      return null;
    }
  },

  async getOpportunityMomentum(): Promise<OpportunityMomentumResult[]> {
    try {
      const response = await apiClient.get<any>('/trends/opportunities');
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.momentum) ? data.momentum : [];
    } catch (error) {
      console.error('Error fetching opportunity momentum:', error);
      return [];
    }
  },
};
