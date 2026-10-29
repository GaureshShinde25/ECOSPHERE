import { apiClient } from './apiClient';

export interface GroundedAction {
  actionId?: string;
  actionType:
    | 'APPLY_JOB'
    | 'VIEW_JOB'
    | 'BOOK_SERVICE'
    | 'VIEW_SERVICE'
    | 'CREATE_JOB'
    | 'CREATE_SERVICE'
    | 'COMPLETE_PROFILE'
    | 'VIEW_SKILL'
    | 'VIEW_BUSINESS'
    | 'MESSAGE_BUSINESS';
  entityType: 'JOB' | 'SERVICE' | 'SKILL' | 'BUSINESS' | 'PROFILE';
  entityId: string | number;
  title: string;
  description: string;
  label: string;
  priority: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  targetScreen: string;
  targetParams: Record<string, any>;
  reason: string;
  evidence: Array<{
    type: 'OBSERVED' | 'CALCULATED';
    label: string;
    value: string | number;
  }>;
}

export interface ActivationMetrics {
  city: string;
  applicationsGenerated: number;
  applicationsShortlisted: number;
  bookingsGenerated: number;
  bookingsCompleted: number;
  jobsAvailable: number;
  totalVacancies?: number;
  servicesAvailable: number;
  activeWorkers: number;
  activeProviders: number;
  activeDeficitSkills?: number;
}

export interface WorkerActivationData {
  userId: string;
  city: string;
  profileCompleteness: {
    isComplete: boolean;
    missingFields: string[];
  };
  matchingJobs: Array<{
    jobId: string;
    title: string;
    employerName: string;
    salary: string;
    location: string;
  }>;
  actions: GroundedAction[];
}

export interface BusinessActivationData {
  userId: string;
  city: string;
  pendingApplicantsCount: number;
  topSkillShortages: Array<{ skillName: string; gapRatio: number; vacancyCount: number }>;
  actions: GroundedAction[];
}

export interface CustomerActivationData {
  userId: string;
  city: string;
  activeBookingsCount: number;
  actions: GroundedAction[];
}

export const activationService = {
  async getNextBestActions(
    role: string = 'worker',
    city: string = 'Kolkata'
  ): Promise<{ role: string; city: string; actions: GroundedAction[] }> {
    try {
      const response = await apiClient.get<any>(
        `/activation/next-actions?role=${encodeURIComponent(role)}&city=${encodeURIComponent(city)}`
      );
      const data = response?.data?.data || response?.data || response;
      return data || { role, city, actions: [] };
    } catch (err) {
      console.warn('Failed to fetch next best actions:', err);
      return { role, city, actions: [] };
    }
  },

  async getMetrics(city: string = 'Kolkata'): Promise<ActivationMetrics | null> {
    try {
      const response = await apiClient.get<any>(
        `/activation/metrics?city=${encodeURIComponent(city)}`
      );
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch activation metrics:', err);
      return null;
    }
  },

  async getWorkerActivation(city: string = 'Kolkata'): Promise<WorkerActivationData | null> {
    try {
      const response = await apiClient.get<any>(
        `/activation/worker?city=${encodeURIComponent(city)}`
      );
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch worker activation:', err);
      return null;
    }
  },

  async getBusinessActivation(city: string = 'Kolkata'): Promise<BusinessActivationData | null> {
    try {
      const response = await apiClient.get<any>(
        `/activation/business?city=${encodeURIComponent(city)}`
      );
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch business activation:', err);
      return null;
    }
  },

  async getCustomerActivation(city: string = 'Kolkata'): Promise<CustomerActivationData | null> {
    try {
      const response = await apiClient.get<any>(
        `/activation/customer?city=${encodeURIComponent(city)}`
      );
      const data = response?.data?.data || response?.data || response;
      return data || null;
    } catch (err) {
      console.warn('Failed to fetch customer activation:', err);
      return null;
    }
  },
};
