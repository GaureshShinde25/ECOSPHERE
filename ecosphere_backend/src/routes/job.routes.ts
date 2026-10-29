import { Router } from 'express';
import { z } from 'zod';
import { jobController } from '../controllers/jobController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

const createJobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  description: z.string().optional(),
  jobType: z.string().optional(),
  workMode: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryPeriod: z.string().optional(),
  experienceMin: z.number().optional(),
  experienceMax: z.number().optional(),
  vacancyCount: z.number().optional(),
  qualification: z.string().optional(),
  applicationDeadline: z.string().optional(),
  businessId: z.string().optional(),
  jobCategoryId: z.number().optional(),
});

const applyJobSchema = z.object({
  coverNote: z.string().optional(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
  expectedSalary: z.number().optional(),
  noticePeriodDays: z.number().optional(),
});

const updateAppStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

// Job discovery endpoints
router.get('/', jobController.getJobs);
router.get('/mine', requireAuth, requireRole('seller', 'administrator'), jobController.getMyJobs);
router.post('/', requireAuth, requireRole('seller', 'administrator'), validateBody(createJobSchema), jobController.createJob);

// Candidate Application endpoints
router.get('/applications/mine', requireAuth, jobController.getMyApplications);
router.get('/applications/seller', requireAuth, requireRole('seller', 'administrator'), jobController.getJobApplications);
router.put('/applications/:id/status', requireAuth, requireRole('seller', 'administrator'), validateBody(updateAppStatusSchema), jobController.updateApplicationStatus);

// Specific Job endpoints
router.get('/:id', jobController.getJobById);
router.put('/:id', requireAuth, requireRole('seller', 'administrator'), jobController.updateJob);
router.post('/:id/apply', requireAuth, validateBody(applyJobSchema), jobController.applyForJob);
router.get('/:id/applications', requireAuth, requireRole('seller', 'administrator'), jobController.getJobApplications);

export default router;
