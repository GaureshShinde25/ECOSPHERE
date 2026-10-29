import { apiClient } from './apiClient';

export interface CanonicalSkill {
  skillId: number;
  skillName: string;
  category: string;
  isActive: boolean;
}

export interface SkillDemandItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  demandCount: number;
  vacancyCount: number;
  bookingDemand: number;
  activeProviderCount: number;
  businessCount: number;
  demandRank: number;
  evidence: Array<{
    type: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
    label: string;
    value: any;
  }>;
}

export interface SkillSupplyGapItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  demandCount: number;
  supplyCount: number;
  demandSupplyRatio: number;
  marketStatus: 'DEFICIT' | 'BALANCED' | 'SURPLUS';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  isZeroSupply: boolean;
  limitations: Array<{ code: string; description: string; severity: 'INFO' | 'WARNING' }>;
  evidence: Array<{
    type: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
    label: string;
    value: any;
  }>;
}

export interface SkillTrendItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  current7DayCount: number;
  previous7DayCount: number;
  growthPercent: number;
  momentumScore: number;
  isEmerging: boolean;
  isDeclining: boolean;
  trendDirection: 'GROWING' | 'STABLE' | 'DECLINING';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EmploymentSkillItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  openJobsCount: number;
  totalVacancies: number;
  salaryMin: number;
  salaryMax: number;
  salaryAverage: number;
  employmentOpportunityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  employersCount: number;
  sampleJobs: Array<{
    jobId: string;
    jobTitle: string;
    businessName: string;
    vacancies: number;
    salaryMin: number;
    salaryMax: number;
    workMode: string;
    jobType: string;
  }>;
  evidence: Array<{
    type: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
    label: string;
    value: any;
  }>;
}

export interface SkillDetailResponse {
  skill: CanonicalSkill;
  city: string;
  demandCount: number;
  vacancyCount: number;
  bookingDemand: number;
  supplyCount: number;
  demandSupplyRatio: number;
  marketStatus: 'DEFICIT' | 'BALANCED' | 'SURPLUS';
  wowGrowthPercent: number;
  momentumScore: number;
  employmentOpportunityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  openJobsCount: number;
  salaryRange: { min: number; max: number; avg: number };
  activeJobs: Array<any>;
  evidence: Array<{ type: 'OBSERVED' | 'CALCULATED' | 'INFERRED'; label: string; value: any }>;
  limitations: Array<{ code: string; description: string; severity: 'INFO' | 'WARNING' }>;
}

export const skillIntelligenceService = {
  /**
   * Fetches canonical skills list with demand summary
   */
  async getSkills(city: string = 'Kolkata', category?: string): Promise<SkillDemandItem[]> {
    try {
      const url = `/skills?city=${encodeURIComponent(city)}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
      const response = await apiClient.get<any>(url);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.skills) ? data.skills : [];
    } catch (error) {
      console.error('Error fetching skills:', error);
      return [];
    }
  },

  /**
   * Fetches skills ranked by local marketplace demand
   */
  async getSkillDemand(city: string = 'Kolkata', limit: number = 10): Promise<SkillDemandItem[]> {
    try {
      const response = await apiClient.get<any>(`/skills/demand?city=${encodeURIComponent(city)}&limit=${limit}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.skills) ? data.skills : [];
    } catch (error) {
      console.error('Error fetching skill demand:', error);
      return [];
    }
  },

  /**
   * Fetches skill supply shortages and gaps
   */
  async getSkillSupplyGaps(city: string = 'Kolkata', limit: number = 10): Promise<SkillSupplyGapItem[]> {
    try {
      const response = await apiClient.get<any>(`/skills/gaps?city=${encodeURIComponent(city)}&limit=${limit}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.gaps) ? data.gaps : [];
    } catch (error) {
      console.error('Error fetching skill gaps:', error);
      return [];
    }
  },

  /**
   * Fetches short-term WoW skill growth trends
   */
  async getSkillTrends(city: string = 'Kolkata'): Promise<SkillTrendItem[]> {
    try {
      const response = await apiClient.get<any>(`/skills/trends?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.trends) ? data.trends : [];
    } catch (error) {
      console.error('Error fetching skill trends:', error);
      return [];
    }
  },

  /**
   * Fetches employment opportunities grouped by skill
   */
  async getEmploymentOpportunities(city: string = 'Kolkata', limit: number = 10): Promise<EmploymentSkillItem[]> {
    try {
      const response = await apiClient.get<any>(`/skills/employment?city=${encodeURIComponent(city)}&limit=${limit}`);
      const data = response?.data?.data || response?.data || response;
      return Array.isArray(data?.skills) ? data.skills : [];
    } catch (error) {
      console.error('Error fetching employment opportunities:', error);
      return [];
    }
  },

  /**
   * Fetches full detail breakdown for a single skill
   */
  async getSkillDetail(skillId: number, city: string = 'Kolkata'): Promise<SkillDetailResponse | null> {
    try {
      const response = await apiClient.get<any>(`/skills/${skillId}?city=${encodeURIComponent(city)}`);
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (error) {
      console.error(`Error fetching skill #${skillId}:`, error);
      return null;
    }
  },

  /**
   * Fetches role-tailored skill recommendations
   */
  async getRecommendations(city: string = 'Kolkata'): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/skills/recommendations?city=${encodeURIComponent(city)}`);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('Error fetching skill recommendations:', error);
      return null;
    }
  },
};
