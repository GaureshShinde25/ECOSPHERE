import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { jobService } from '../services/jobService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const jobController = {
  getJobs: async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;
      const jobType = req.query.jobType ? String(req.query.jobType) : undefined;
      const workMode = req.query.workMode ? String(req.query.workMode) : undefined;
      const city = req.query.city ? String(req.query.city) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const result = await jobService.getJobs({
        search,
        category,
        jobType,
        workMode,
        status,
        city,
        page,
        limit,
      });

      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch jobs', 500);
    }
  },

  getJobById: async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Job ID is required', 400);
    }

    try {
      const job = await jobService.getJobById(String(rawId));
      if (!job) {
        return sendError(res, 'NOT_FOUND', `Job with ID ${rawId} not found`, 404);
      }
      return sendSuccess(res, { job });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch job details', 500);
    }
  },

  getMyJobs: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Employer account required.', 403);
    }

    try {
      const jobs = await jobService.getMyJobs(req.user.userId);
      return sendSuccess(res, { jobs, count: jobs.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch employer jobs', 500);
    }
  },

  createJob: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Only sellers/employers can create job listings.', 403);
    }

    try {
      const job = await jobService.createJob(req.user.userId, req.body);
      return sendSuccess(res, { message: 'Job opening published successfully', job }, 201);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'CREATE_JOB_FAILED', err.message || 'Failed to publish job', 400);
    }
  },

  updateJob: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Job ID is required', 400);
    }

    try {
      const updatedJob = await jobService.updateJob(String(rawId), req.user.userId, req.user.role, req.body);
      return sendSuccess(res, { message: 'Job listing updated successfully', job: updatedJob });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'JOB_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Job with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_JOB_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only modify jobs published by your account.', 403);
      }
      return sendError(res, 'UPDATE_JOB_FAILED', err.message || 'Failed to update job', 400);
    }
  },

  applyForJob: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Job ID is required', 400);
    }

    try {
      const application = await jobService.applyForJob(String(rawId), req.user.userId, req.body);
      return sendSuccess(res, { message: 'Job application submitted successfully', application }, 201);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'JOB_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Job with ID ${rawId} not found`, 404);
      }
      if (err.message.startsWith('ALREADY_APPLIED')) {
        return sendError(res, 'ALREADY_APPLIED', err.message, 400);
      }
      return sendError(res, 'APPLICATION_FAILED', err.message || 'Failed to submit job application', 400);
    }
  },

  getMyApplications: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    try {
      const applications = await jobService.getMyApplications(req.user.userId);
      return sendSuccess(res, { applications, count: applications.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch candidate applications', 500);
    }
  },

  getJobApplications: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Employer or Administrator role required.', 403);
    }

    const rawJobId = req.params.id ? String(req.params.id) : undefined;

    try {
      const applications = await jobService.getJobApplications(req.user.userId, req.user.role, rawJobId);
      return sendSuccess(res, { applications, count: applications.length });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_JOB_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only view applications for your own job listings.', 403);
      }
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to fetch job applications', 500);
    }
  },

  updateApplicationStatus: async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    }

    if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
      return sendError(res, 'FORBIDDEN', 'Access denied. Employer or Administrator role required.', 403);
    }

    const rawId = req.params.id;
    if (!rawId) {
      return sendError(res, 'INVALID_ID', 'Application ID is required', 400);
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return sendError(res, 'INVALID_STATUS', 'Valid application status is required', 400);
    }

    try {
      const updatedApp = await jobService.updateApplicationStatus(
        String(rawId),
        req.user.userId,
        req.user.role,
        status
      );
      return sendSuccess(res, { message: 'Application status updated successfully', application: updatedApp });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'APPLICATION_NOT_FOUND') {
        return sendError(res, 'NOT_FOUND', `Application with ID ${rawId} not found`, 404);
      }
      if (err.message === 'FORBIDDEN_APPLICATION_ACCESS') {
        return sendError(res, 'FORBIDDEN', 'Access denied. You can only modify candidates for your own job listings.', 403);
      }
      return sendError(res, 'UPDATE_FAILED', err.message || 'Failed to update application status', 400);
    }
  },
};
