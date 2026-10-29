import { apiClient } from './apiClient';

export interface DecisionEvidenceItem {
  metric: string;
  value: string | number;
  classification: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DecisionLimitationItem {
  code: string;
  description: string;
  severity: 'WARNING' | 'INFO';
}

export interface EvaluatedOpportunityDecision {
  opportunity: any;
  decisionScore: number;
  opportunityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: DecisionEvidenceItem[];
  limitations: DecisionLimitationItem[];
  rankReason: string;
}

export interface OpportunityComparisonResult {
  categories: string[];
  dimensions: Array<{
    dimension: string;
    valueA: string | number;
    valueB: string | number;
    winner: string;
  }>;
  winner: string;
  reason: string;
  evidence: DecisionEvidenceItem[];
  limitations: DecisionLimitationItem[];
}

export interface EmploymentIntelligenceResult {
  observedHiringVacancies: number;
  observedActiveProviders: number;
  inferredServiceGaps: Array<{ category: string; demandSupplyRatio: number; confidence: string }>;
  employmentSignals: Array<{ type: string; category: string; description: string; classification: string }>;
  evidence: DecisionEvidenceItem[];
}

export const decisionIntelligenceService = {
  async getOpportunities(limit: number = 5): Promise<EvaluatedOpportunityDecision[]> {
    try {
      const response = await apiClient.get<any>(`/decision-intelligence/opportunities?limit=${limit}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.decisions) ? data.decisions : [];
    } catch (error) {
      console.error('Error fetching decision opportunities:', error);
      return [];
    }
  },

  async compareOpportunities(categoryA: string, categoryB: string, city: string = 'Kolkata'): Promise<OpportunityComparisonResult | null> {
    try {
      const response = await apiClient.get<any>(
        `/decision-intelligence/compare?categoryA=${encodeURIComponent(categoryA)}&categoryB=${encodeURIComponent(categoryB)}&city=${encodeURIComponent(city)}`
      );
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error comparing opportunities:', error);
      return null;
    }
  },

  async getEmploymentIntelligence(city: string = 'Kolkata'): Promise<EmploymentIntelligenceResult | null> {
    try {
      const response = await apiClient.get<any>(`/decision-intelligence/employment?city=${encodeURIComponent(city)}`);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error fetching employment intelligence:', error);
      return null;
    }
  },
};
