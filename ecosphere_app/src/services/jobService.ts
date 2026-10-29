import { Job, JobApplication } from '../types';
import { mockJobs, mockApplications } from '../data/mockData';
import { apiClient } from './apiClient';

export interface GetJobsQueryOptions {
  search?: string;
  category?: string;
  jobType?: string;
  workMode?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export const jobService = {
  /**
   * Fetch jobs from GET /api/jobs with optional search, category, type, and pagination
   */
  async getJobs(options: GetJobsQueryOptions = {}): Promise<Job[]> {
    try {
      const queryParts: string[] = [];
      if (options.search) queryParts.push(`search=${encodeURIComponent(options.search)}`);
      if (options.category) queryParts.push(`category=${encodeURIComponent(options.category)}`);
      if (options.jobType) queryParts.push(`jobType=${encodeURIComponent(options.jobType)}`);
      if (options.workMode) queryParts.push(`workMode=${encodeURIComponent(options.workMode)}`);
      if (options.city) queryParts.push(`city=${encodeURIComponent(options.city)}`);
      if (options.page) queryParts.push(`page=${options.page}`);
      if (options.limit) queryParts.push(`limit=${options.limit}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

      const response = await apiClient.get<any>(`/jobs${queryString}`, {
        requiresAuth: false,
      });

      const payload = response?.data || response;
      if (payload && (payload.jobs || Array.isArray(payload))) {
        return payload.jobs || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[jobService.getJobs] Error:', error);
      }
    }
    return [];
  },

  /**
   * Fetch single job details from GET /api/jobs/:id
   */
  async getJobById(id: string): Promise<Job | undefined> {
    try {
      const response = await apiClient.get<any>(`/jobs/${id}`, {
        requiresAuth: false,
      });
      const payload = response?.data || response;
      if (payload && (payload.job || payload.id || payload.title)) {
        return payload.job || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[jobService.getJobById] Error fetching job ID ${id}`, error);
      }
    }
    return undefined;
  },

  /**
   * Fetch seller's own job openings from GET /api/jobs/mine
   */
  async getMyJobs(): Promise<Job[]> {
    try {
      const response = await apiClient.get<any>('/jobs/mine', {
        requiresAuth: true,
      });
      const payload = response?.data || response;
      if (payload && (payload.jobs || Array.isArray(payload))) {
        return payload.jobs || payload;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[jobService.getMyJobs] Error fetching seller jobs', error);
      }
    }
    return [];
  },

  /**
   * Submit job application to backend POST /api/jobs/:id/apply
   */
  async applyForJob(jobId: string, coverNote?: string): Promise<JobApplication> {
    const response = await apiClient.post<{ success: boolean; application: JobApplication }>(
      `/jobs/${jobId}/apply`,
      { coverNote },
      { requiresAuth: true }
    );
    if (response && response.application) {
      return response.application;
    }
    throw new Error('Failed to submit job application');
  },

  /**
   * Fetch authenticated candidate's applications from GET /api/jobs/applications/mine
   */
  async getUserApplications(): Promise<JobApplication[]> {
    try {
      const response = await apiClient.get<{ success: boolean; applications: JobApplication[] }>('/jobs/applications/mine', {
        requiresAuth: true,
      });
      if (response && response.applications && Array.isArray(response.applications)) {
        return response.applications;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[jobService.getUserApplications] Error fetching candidate applications', error);
      }
    }
    return mockApplications;
  },

  /**
   * Fetch employer's received job applications from GET /api/jobs/applications/seller
   */
  async getSellerApplications(): Promise<JobApplication[]> {
    try {
      const response = await apiClient.get<{ success: boolean; applications: JobApplication[] }>('/jobs/applications/seller', {
        requiresAuth: true,
      });
      if (response && response.applications && Array.isArray(response.applications)) {
        return response.applications;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[jobService.getSellerApplications] Error fetching employer applications', error);
      }
    }
    return mockApplications;
  },

  /**
   * Publish a new job opening on backend POST /api/jobs
   */
  async createJob(jobData: Partial<Job>): Promise<Job> {
    const response = await apiClient.post<{ success: boolean; job: Job }>('/jobs', jobData, {
      requiresAuth: true,
    });
    if (response && response.job) {
      return response.job;
    }
    throw new Error('Failed to create job opening');
  },

  /**
   * Update existing job opening on backend PUT /api/jobs/:id
   */
  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    const response = await apiClient.put<{ success: boolean; job: Job }>(`/jobs/${id}`, jobData, {
      requiresAuth: true,
    });
    if (response && response.job) {
      return response.job;
    }
    throw new Error('Failed to update job opening');
  },

  /**
   * Update job application status on backend PUT /api/jobs/applications/:id/status
   */
  async updateApplicationStatus(id: string, status: string): Promise<JobApplication> {
    const response = await apiClient.put<{ success: boolean; application: JobApplication }>(
      `/jobs/applications/${id}/status`,
      { status },
      { requiresAuth: true }
    );
    if (response && response.application) {
      return response.application;
    }
    throw new Error('Failed to update application status');
  },
};
