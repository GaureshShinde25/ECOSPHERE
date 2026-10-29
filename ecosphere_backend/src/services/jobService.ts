import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { skillTaxonomyService } from './skillTaxonomyService.js';
import { logger } from '../utils/logger.js';

export interface GetJobsOptions {
  search?: string;
  category?: string;
  jobType?: string;
  workMode?: string;
  status?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  title: string;
  description?: string;
  jobType?: string;
  workMode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  experienceMin?: number;
  experienceMax?: number;
  vacancyCount?: number;
  qualification?: string;
  applicationDeadline?: string;
  businessId?: string;
  jobCategoryId?: number;
  salary?: string;
  city?: string;
  state?: string;
  area?: string;
  locationText?: string;
  location?: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  jobType?: string;
  workMode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  city?: string;
  state?: string;
  area?: string;
  locationText?: string;
  location?: string;
  status?: string;
  isActive?: boolean;
}

export interface ApplyJobInput {
  coverNote?: string;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
}

export interface JobDetail {
  id: string;
  employerUserId: string;
  businessId?: string;
  employerName: string;
  employerLogo?: string;
  title: string;
  category: string;
  description: string;
  salary: string;
  annualSalaryDisplay?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  location: string;
  city?: string;
  state?: string;
  area?: string;
  locationText?: string;
  jobType: string;
  workMode: string;
  experienceMin?: number;
  experienceMax?: number;
  qualification?: string;
  vacancyCount: number;
  postedDate: string;
  skills: string[];
  applicantsCount: number;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApplicationDetail {
  id: string;
  jobId: string;
  jobTitle: string;
  employerName: string;
  applicantId: string;
  applicantUserId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  appliedDate: string;
  status: string;
  coverNote?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    return directId;
  }

  const cleanMobile = userIdStr.replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  if (searchMobile) {
    const userByMobile = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE Mobile = @exactMobile OR Mobile = @mobile',
      [
        { name: 'exactMobile', type: mssql.NVarChar(50), value: userIdStr },
        { name: 'mobile', type: mssql.NVarChar(50), value: searchMobile },
      ]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

export function formatIndianRupees(num: number): string {
  if (isNaN(num) || num < 0) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

export function formatSalary(salMin?: number, salMax?: number, period?: string): { salary: string; annualSalaryDisplay?: string } {
  const normPeriod = (period || 'MONTHLY').toUpperCase().trim();

  if (normPeriod === 'UNPAID' || (salMin === 0 && salMax === 0 && normPeriod === 'UNPAID')) {
    return { salary: 'Unpaid' };
  }

  const min = salMin !== undefined && salMin !== null ? Number(salMin) : undefined;
  const max = salMax !== undefined && salMax !== null ? Number(salMax) : undefined;

  if (min === undefined && max === undefined) {
    return { salary: 'Competitive Compensation' };
  }

  const rangeStr = (min !== undefined && max !== undefined && min !== max)
    ? `${formatIndianRupees(min)}–${formatIndianRupees(max)}`
    : formatIndianRupees(min !== undefined ? min : max!);

  switch (normPeriod) {
    case 'HOURLY':
      return { salary: `${rangeStr}/hour` };
    case 'DAILY':
      return { salary: `${rangeStr}/day` };
    case 'PROJECT':
      return { salary: `${rangeStr}/project` };
    case 'YEARLY':
      return { salary: `${rangeStr}/year` };
    case 'MONTHLY':
    default: {
      const primary = `${rangeStr}/month`;
      let annualEst: string | undefined;
      if (min !== undefined || max !== undefined) {
        const annualMin = min !== undefined ? min * 12 : undefined;
        const annualMax = max !== undefined ? max * 12 : undefined;
        const annualRangeStr = (annualMin !== undefined && annualMax !== undefined && annualMin !== annualMax)
          ? `${formatIndianRupees(annualMin)}–${formatIndianRupees(annualMax)}`
          : formatIndianRupees(annualMin !== undefined ? annualMin : annualMax!);
        annualEst = `Estimated annual equivalent: ${annualRangeStr}/year`;
      }
      return { salary: primary, annualSalaryDisplay: annualEst };
    }
  }
}

export function formatJobType(typeStr?: string): string {
  if (!typeStr) return 'Full-time';
  const clean = typeStr.toUpperCase().replace(/[- ]/g, '_');
  switch (clean) {
    case 'FULL_TIME': return 'Full-time';
    case 'PART_TIME': return 'Part-time';
    case 'CONTRACT': return 'Contract';
    case 'TEMPORARY': return 'Temporary';
    case 'INTERNSHIP': return 'Internship';
    case 'APPRENTICESHIP': return 'Apprenticeship';
    case 'FREELANCE': return 'Freelance';
    case 'GIG_WORK': return 'Gig Work';
    case 'SMALL_TASKS': return 'Small Tasks';
    case 'ON_DEMAND': return 'On-Demand Work';
    default: return typeStr;
  }
}

export function parseJobTypeToEnum(typeStr?: string): string {
  if (!typeStr) return 'FULL_TIME';
  const clean = typeStr.toUpperCase().replace(/[- ]/g, '_');
  switch (clean) {
    case 'FULL_TIME': return 'FULL_TIME';
    case 'PART_TIME': return 'PART_TIME';
    case 'CONTRACT': return 'CONTRACT';
    case 'TEMPORARY': return 'TEMPORARY';
    case 'INTERNSHIP': return 'INTERNSHIP';
    case 'APPRENTICESHIP': return 'APPRENTICESHIP';
    case 'FREELANCE': return 'FREELANCE';
    case 'GIG':
    case 'GIG_WORK': return 'GIG_WORK';
    case 'TASKS':
    case 'SMALL_TASKS': return 'SMALL_TASKS';
    case 'ON_DEMAND':
    case 'ON_DEMAND_WORK': return 'ON_DEMAND';
    default: return clean;
  }
}

export function formatWorkMode(modeStr?: string): string {
  if (!modeStr) return 'On-site';
  const clean = modeStr.toUpperCase().replace(/[- ]/g, '_');
  switch (clean) {
    case 'ON_SITE': return 'On-site';
    case 'REMOTE': return 'Remote';
    case 'HYBRID': return 'Hybrid';
    default: return modeStr;
  }
}

export function parseWorkModeToEnum(modeStr?: string): string {
  if (!modeStr) return 'ON_SITE';
  const clean = modeStr.toUpperCase().replace(/[- ]/g, '_');
  switch (clean) {
    case 'ON_SITE': return 'ON_SITE';
    case 'REMOTE': return 'REMOTE';
    case 'HYBRID': return 'HYBRID';
    default: return clean;
  }
}

function mapDbRowToJob(row: any): JobDetail {
  const empName = row.BusinessName || `${row.EmployerFirstName || ''} ${row.EmployerLastName || ''}`.trim() || 'ECOSPHERE Enterprise';
  const salInfo = formatSalary(
    row.SalaryMin !== null && row.SalaryMin !== undefined ? Number(row.SalaryMin) : undefined,
    row.SalaryMax !== null && row.SalaryMax !== undefined ? Number(row.SalaryMax) : undefined,
    row.SalaryPeriod
  );
  const posted = row.CreatedAt ? new Date(row.CreatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  let locStr = '';
  if (row.LocationText && row.LocationText.trim()) {
    locStr = row.LocationText.trim();
  } else if (row.City || row.State) {
    const parts = [row.Area, row.City, row.State].filter(Boolean);
    locStr = parts.join(', ');
  } else if (row.BusinessCity || row.BusinessState) {
    const parts = [row.BusinessCity, row.BusinessState].filter(Boolean);
    locStr = parts.join(', ');
  } else {
    locStr = 'Pune, Maharashtra';
  }

  const formattedMode = formatWorkMode(row.WorkMode);
  if (formattedMode === 'Remote' && !row.City && !row.LocationText) {
    locStr = 'Pan-India (Remote)';
  }

  return {
    id: String(row.JobId),
    employerUserId: String(row.EmployerUserId),
    businessId: row.BusinessId ? String(row.BusinessId) : undefined,
    employerName: empName,
    employerLogo: row.BusinessLogo || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80',
    title: row.JobTitle || 'Untitled Position',
    category: row.CategoryName || 'General Employment',
    description: row.Description || 'Exciting career opportunity at ECOSPHERE verified partner network.',
    salary: salInfo.salary,
    annualSalaryDisplay: salInfo.annualSalaryDisplay,
    salaryMin: row.SalaryMin !== null && row.SalaryMin !== undefined ? Number(row.SalaryMin) : undefined,
    salaryMax: row.SalaryMax !== null && row.SalaryMax !== undefined ? Number(row.SalaryMax) : undefined,
    salaryPeriod: row.SalaryPeriod || 'MONTHLY',
    location: locStr,
    city: row.City || row.BusinessCity || undefined,
    state: row.State || row.BusinessState || undefined,
    area: row.Area || undefined,
    locationText: row.LocationText || undefined,
    jobType: formatJobType(row.JobType),
    workMode: formattedMode,
    experienceMin: row.ExperienceMin ? Number(row.ExperienceMin) : undefined,
    experienceMax: row.ExperienceMax ? Number(row.ExperienceMax) : undefined,
    qualification: row.Qualification || undefined,
    vacancyCount: row.VacancyCount ? Number(row.VacancyCount) : 1,
    postedDate: posted,
    skills: (() => {
      const mapped = skillTaxonomyService.mapJobTitleToSkills(row.JobTitle || '');
      return mapped.length > 0 ? mapped.map((m) => m.skillName) : ['Operations', 'Management'];
    })(),
    applicantsCount: row.ApplicantsCount ? Number(row.ApplicantsCount) : 0,
    status: row.Status || 'OPEN',
    isActive: row.IsActive !== false,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapDbRowToApplication(row: any): ApplicationDetail {
  const applicantName = `${row.ApplicantFirstName || ''} ${row.ApplicantLastName || ''}`.trim() || 'Job Candidate';
  const empName = row.BusinessName || `${row.EmployerFirstName || ''} ${row.EmployerLastName || ''}`.trim() || 'ECOSPHERE Employer';
  const appliedDateStr = row.AppliedAt ? new Date(row.AppliedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: String(row.ApplicationId),
    jobId: String(row.JobId),
    jobTitle: row.JobTitle || 'Job Position',
    employerName: empName,
    applicantId: String(row.ApplicantUserId),
    applicantUserId: String(row.ApplicantUserId),
    applicantName,
    applicantEmail: row.ApplicantEmail || `${row.ApplicantUserId}@ecosphere.internal`,
    applicantPhone: row.ApplicantMobile || '9876543210',
    appliedDate: appliedDateStr,
    status: row.Status || 'SUBMITTED',
    coverNote: row.CoverLetter || undefined,
    resumeUrl: row.ResumeUrl || undefined,
    expectedSalary: row.ExpectedSalary ? Number(row.ExpectedSalary) : undefined,
    noticePeriodDays: row.NoticePeriodDays ? Number(row.NoticePeriodDays) : undefined,
  };
}

export const jobService = {
  /**
   * Public & Authenticated Job discovery with server-side pagination, search, and filtering
   */
  async getJobs(options: GetJobsOptions = {}): Promise<{ jobs: JobDetail[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['j.IsActive = 1'];
    const sqlParams: { name: string; type: any; value: any }[] = [];

    if (options.status) {
      whereClauses.push('j.Status = @status');
      sqlParams.push({ name: 'status', type: mssql.VarChar(30), value: options.status.toUpperCase() });
    } else {
      whereClauses.push("j.Status = 'OPEN'");
    }

    if (options.search) {
      whereClauses.push('(j.JobTitle LIKE @search OR j.Description LIKE @search OR b.BusinessName LIKE @search OR j.City LIKE @search OR j.LocationText LIKE @search)');
      sqlParams.push({ name: 'search', type: mssql.NVarChar(250), value: `%${options.search}%` });
    }

    if (options.city) {
      whereClauses.push('(j.City LIKE @city OR b.City LIKE @city OR j.LocationText LIKE @city)');
      sqlParams.push({ name: 'city', type: mssql.NVarChar(100), value: `%${options.city}%` });
    }

    if (options.category) {
      whereClauses.push('c.CategoryName LIKE @category');
      sqlParams.push({ name: 'category', type: mssql.NVarChar(100), value: `%${options.category}%` });
    }

    if (options.jobType) {
      whereClauses.push('j.JobType = @jobType');
      sqlParams.push({ name: 'jobType', type: mssql.VarChar(50), value: parseJobTypeToEnum(options.jobType) });
    }

    if (options.workMode) {
      whereClauses.push('j.WorkMode = @workMode');
      sqlParams.push({ name: 'workMode', type: mssql.VarChar(30), value: parseWorkModeToEnum(options.workMode) });
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS TotalCount 
         FROM Jobs j WITH (NOLOCK)
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         ${whereSql}`,
        sqlParams
      );
      const total = countRes.recordset && countRes.recordset[0] ? Number(countRes.recordset[0].TotalCount) : 0;

      const pageParams = [
        ...sqlParams,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const jobsRes = await databaseService.query<any>(
        `SELECT 
           j.JobId, j.EmployerUserId, j.BusinessId, j.JobCategoryId, j.JobTitle,
           j.Description, j.JobType, j.WorkMode, j.ExperienceMin, j.ExperienceMax,
           j.SalaryMin, j.SalaryMax, j.SalaryPeriod, j.Qualification, j.VacancyCount,
           j.City, j.State, j.Area, j.LocationText,
           j.Status, j.IsVerified, j.IsActive, j.CreatedAt, j.UpdatedAt,
           b.BusinessName, b.LogoUrl AS BusinessLogo, b.City AS BusinessCity, b.State AS BusinessState,
           u.FirstName AS EmployerFirstName, u.LastName AS EmployerLastName,
           0 AS ApplicantsCount
         FROM Jobs j WITH (NOLOCK)
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         LEFT JOIN Users u WITH (NOLOCK) ON j.EmployerUserId = u.UserId
         ${whereSql}
         ORDER BY j.JobId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const jobs = (jobsRes.recordset || []).map(mapDbRowToJob);
      return { jobs, total, page, limit };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query jobs list', { options, error: err.message });
      throw err;
    }
  },

  /**
   * Query single job detail by JobId
   */
  async getJobById(jobIdStr: string): Promise<JobDetail | null> {
    const numericJobId = parseInt(jobIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericJobId)) return null;

    try {
      const jobRes = await databaseService.query<any>(
        `SELECT 
           j.JobId, j.EmployerUserId, j.BusinessId, j.JobCategoryId, j.JobTitle,
           j.Description, j.JobType, j.WorkMode, j.ExperienceMin, j.ExperienceMax,
           j.SalaryMin, j.SalaryMax, j.SalaryPeriod, j.Qualification, j.VacancyCount,
           j.City, j.State, j.Area, j.LocationText,
           j.Status, j.IsVerified, j.IsActive, j.CreatedAt, j.UpdatedAt,
           b.BusinessName, b.LogoUrl AS BusinessLogo, b.City AS BusinessCity, b.State AS BusinessState,
           c.CategoryName,
           u.FirstName AS EmployerFirstName, u.LastName AS EmployerLastName,
           (SELECT COUNT(*) FROM JobApplications ja WHERE ja.JobId = j.JobId) AS ApplicantsCount
         FROM Jobs j WITH (NOLOCK)
         LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
         LEFT JOIN JobCategories c WITH (NOLOCK) ON j.JobCategoryId = c.JobCategoryId
         LEFT JOIN Users u WITH (NOLOCK) ON j.EmployerUserId = u.UserId
         WHERE j.JobId = @jId`,
        [{ name: 'jId', type: mssql.BigInt(), value: numericJobId }]
      );

      if (!jobRes.recordset || jobRes.recordset.length === 0) {
        return null;
      }
      return mapDbRowToJob(jobRes.recordset[0]);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query job by ID', { jobIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch jobs posted by authenticated seller/employer
   */
  async getMyJobs(requestingUserId: string): Promise<JobDetail[]> {
    const employerUserId = await resolveDbUserId(requestingUserId);
    if (!employerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const jobsRes = await databaseService.query<any>(
        `SELECT 
           j.JobId, j.EmployerUserId, j.BusinessId, j.JobCategoryId, j.JobTitle,
           j.Description, j.JobType, j.WorkMode, j.ExperienceMin, j.ExperienceMax,
           j.SalaryMin, j.SalaryMax, j.SalaryPeriod, j.Qualification, j.VacancyCount,
           j.City, j.State, j.Area, j.LocationText,
           j.Status, j.IsVerified, j.IsActive, j.CreatedAt, j.UpdatedAt,
           b.BusinessName, b.LogoUrl AS BusinessLogo, b.City AS BusinessCity, b.State AS BusinessState,
           c.CategoryName,
           u.FirstName AS EmployerFirstName, u.LastName AS EmployerLastName,
           (SELECT COUNT(*) FROM JobApplications ja WHERE ja.JobId = j.JobId) AS ApplicantsCount
         FROM Jobs j
         LEFT JOIN Businesses b ON j.BusinessId = b.BusinessId
         LEFT JOIN JobCategories c ON j.JobCategoryId = c.JobCategoryId
         INNER JOIN Users u ON j.EmployerUserId = u.UserId
         WHERE j.EmployerUserId = @empUserId
         ORDER BY j.JobId DESC`,
        [{ name: 'empUserId', type: mssql.BigInt(), value: employerUserId }]
      );

      return (jobsRes.recordset || []).map(mapDbRowToJob);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query employer jobs', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Create a new job listing for authenticated employer
   */
  async createJob(requestingUserId: string, input: CreateJobInput): Promise<JobDetail> {
    const employerUserId = await resolveDbUserId(requestingUserId);
    if (!employerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('JOB_TITLE_REQUIRED');
    }

    let numericBizId: number | null = null;
    if (input.businessId) {
      const parsedBiz = parseInt(String(input.businessId).replace(/\D/g, ''), 10);
      if (!isNaN(parsedBiz)) numericBizId = parsedBiz;
    }

    if (!numericBizId) {
      const bizRes = await databaseService.query<any>(
        'SELECT TOP 1 BusinessId FROM Businesses WHERE OwnerUserId = @empUserId AND IsActive = 1',
        [{ name: 'empUserId', type: mssql.BigInt(), value: employerUserId }]
      );
      if (bizRes.recordset && bizRes.recordset.length > 0) {
        numericBizId = Number(bizRes.recordset[0].BusinessId);
      }
    }

    const jobTypeVal = parseJobTypeToEnum(input.jobType);
    const workModeVal = parseWorkModeToEnum(input.workMode);
    const salaryPeriodVal = (input.salaryPeriod || 'MONTHLY').toUpperCase().trim();

    // Validate salary inputs
    const rawMin = input.salaryMin !== undefined && input.salaryMin !== null ? input.salaryMin : (input as any).minSalary;
    const rawMax = input.salaryMax !== undefined && input.salaryMax !== null ? input.salaryMax : (input as any).maxSalary;
    const salMinVal = rawMin !== undefined && rawMin !== null ? Number(rawMin) : undefined;
    const salMaxVal = rawMax !== undefined && rawMax !== null ? Number(rawMax) : undefined;

    if (salaryPeriodVal !== 'UNPAID') {
      if (salMinVal !== undefined && salMinVal < 0) {
        throw new Error('INVALID_SALARY: Minimum salary cannot be negative');
      }
      if (salMaxVal !== undefined && salMaxVal < 0) {
        throw new Error('INVALID_SALARY: Maximum salary cannot be negative');
      }
      if (salMinVal !== undefined && salMaxVal !== undefined && salMinVal > salMaxVal) {
        throw new Error('INVALID_SALARY: Minimum salary cannot exceed maximum salary');
      }
    }

    // Location construction
    const cityVal = input.city ? input.city.trim() : undefined;
    const stateVal = input.state ? input.state.trim() : undefined;
    const areaVal = input.area ? input.area.trim() : undefined;
    const locTextVal = input.locationText || input.location || (
      [areaVal, cityVal, stateVal].filter(Boolean).join(', ') || (workModeVal === 'REMOTE' ? 'Pan-India (Remote)' : undefined)
    );

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO Jobs (
           EmployerUserId, BusinessId, JobCategoryId, JobTitle, Description,
           JobType, WorkMode, SalaryMin, SalaryMax, SalaryPeriod,
           ExperienceMin, ExperienceMax, Qualification, VacancyCount,
           City, State, Area, LocationText,
           Status, IsVerified, IsActive, CreatedAt
         )
         OUTPUT INSERTED.JobId
         VALUES (
           @empUserId, @bizId, @catId, @title, @desc,
           @jobType, @workMode, @salMin, @salMax, @salPeriod,
           @expMin, @expMax, @qual, @vacCount,
           @city, @state, @area, @locText,
           'OPEN', 1, 1, CURRENT_TIMESTAMP
         )`,
        [
          { name: 'empUserId', type: mssql.BigInt(), value: employerUserId },
          { name: 'bizId', type: mssql.BigInt(), value: numericBizId },
          { name: 'catId', type: mssql.Int(), value: input.jobCategoryId || 1 },
          { name: 'title', type: mssql.NVarChar(250), value: input.title.trim() },
          { name: 'desc', type: mssql.NVarChar(mssql.MAX), value: input.description || '' },
          { name: 'jobType', type: mssql.VarChar(50), value: jobTypeVal },
          { name: 'workMode', type: mssql.VarChar(30), value: workModeVal },
          { name: 'salMin', type: mssql.Decimal(18, 2), value: salaryPeriodVal === 'UNPAID' ? 0 : (salMinVal ?? null) },
          { name: 'salMax', type: mssql.Decimal(18, 2), value: salaryPeriodVal === 'UNPAID' ? 0 : (salMaxVal ?? null) },
          { name: 'salPeriod', type: mssql.VarChar(30), value: salaryPeriodVal },
          { name: 'expMin', type: mssql.Decimal(18, 2), value: input.experienceMin || 1 },
          { name: 'expMax', type: mssql.Decimal(18, 2), value: input.experienceMax || 5 },
          { name: 'qual', type: mssql.NVarChar(1000), value: input.qualification || 'Bachelor Degree' },
          { name: 'vacCount', type: mssql.Int(), value: input.vacancyCount || 1 },
          { name: 'city', type: mssql.NVarChar(100), value: cityVal || null },
          { name: 'state', type: mssql.NVarChar(100), value: stateVal || null },
          { name: 'area', type: mssql.NVarChar(100), value: areaVal || null },
          { name: 'locText', type: mssql.NVarChar(250), value: locTextVal || null },
        ]
      );

      const createdJobId = Number(insertRes.recordset[0].JobId);
      const created = await this.getJobById(String(createdJobId));
      if (!created) {
        throw new Error('Job created successfully but failed to reload record');
      }
      return created;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create job', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Update existing job with seller ownership verification
   */
  async updateJob(
    jobIdStr: string,
    requestingUserId: string,
    requestingRole: string,
    input: UpdateJobInput
  ): Promise<JobDetail> {
    const existing = await this.getJobById(jobIdStr);
    if (!existing) {
      throw new Error('JOB_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const isOwner = Number(existing.employerUserId) === dbUserId;
    const isAdmin = requestingRole === 'administrator';

    if (!isOwner && !isAdmin) {
      throw new Error('FORBIDDEN_JOB_ACCESS');
    }

    const numericJobId = parseInt(existing.id, 10);

    const rawMin = input.salaryMin !== undefined && input.salaryMin !== null ? input.salaryMin : (input as any).minSalary;
    const rawMax = input.salaryMax !== undefined && input.salaryMax !== null ? input.salaryMax : (input as any).maxSalary;
    const salMinVal = rawMin !== undefined && rawMin !== null ? Number(rawMin) : undefined;
    const salMaxVal = rawMax !== undefined && rawMax !== null ? Number(rawMax) : undefined;
    const salPeriodVal = input.salaryPeriod ? input.salaryPeriod.toUpperCase().trim() : undefined;

    if (salPeriodVal !== 'UNPAID') {
      const effectiveMin = salMinVal !== undefined ? salMinVal : existing.salaryMin;
      const effectiveMax = salMaxVal !== undefined ? salMaxVal : existing.salaryMax;
      if (effectiveMin !== undefined && effectiveMin < 0) {
        throw new Error('INVALID_SALARY: Minimum salary cannot be negative');
      }
      if (effectiveMax !== undefined && effectiveMax < 0) {
        throw new Error('INVALID_SALARY: Maximum salary cannot be negative');
      }
      if (effectiveMin !== undefined && effectiveMax !== undefined && effectiveMin > effectiveMax) {
        throw new Error('INVALID_SALARY: Minimum salary cannot exceed maximum salary');
      }
    }

    try {
      await databaseService.query(
        `UPDATE Jobs SET
           JobTitle = COALESCE(@title, JobTitle),
           Description = COALESCE(@desc, Description),
           JobType = COALESCE(@jobType, JobType),
           WorkMode = COALESCE(@workMode, WorkMode),
           SalaryMin = COALESCE(@salMin, SalaryMin),
           SalaryMax = COALESCE(@salMax, SalaryMax),
           SalaryPeriod = COALESCE(@salPeriod, SalaryPeriod),
           City = COALESCE(@city, City),
           State = COALESCE(@state, State),
           Area = COALESCE(@area, Area),
           LocationText = COALESCE(@locText, LocationText),
           Status = COALESCE(@status, Status),
           IsActive = COALESCE(@isActive, IsActive),
           UpdatedAt = CURRENT_TIMESTAMP
         WHERE JobId = @jId`,
        [
          { name: 'title', type: mssql.NVarChar(250), value: input.title || null },
          { name: 'desc', type: mssql.NVarChar(mssql.MAX), value: input.description || null },
          { name: 'jobType', type: mssql.VarChar(50), value: input.jobType ? parseJobTypeToEnum(input.jobType) : null },
          { name: 'workMode', type: mssql.VarChar(30), value: input.workMode ? parseWorkModeToEnum(input.workMode) : null },
          { name: 'salMin', type: mssql.Decimal(18, 2), value: salMinVal !== undefined ? salMinVal : null },
          { name: 'salMax', type: mssql.Decimal(18, 2), value: salMaxVal !== undefined ? salMaxVal : null },
          { name: 'salPeriod', type: mssql.VarChar(30), value: salPeriodVal || null },
          { name: 'city', type: mssql.NVarChar(100), value: input.city || null },
          { name: 'state', type: mssql.NVarChar(100), value: input.state || null },
          { name: 'area', type: mssql.NVarChar(100), value: input.area || null },
          { name: 'locText', type: mssql.NVarChar(250), value: input.locationText || input.location || null },
          { name: 'status', type: mssql.VarChar(30), value: input.status ? input.status.toUpperCase() : null },
          { name: 'isActive', type: mssql.Bit(), value: input.isActive !== undefined ? (input.isActive ? 1 : 0) : null },
          { name: 'jId', type: mssql.BigInt(), value: numericJobId },
        ]
      );

      const updated = await this.getJobById(jobIdStr);
      if (!updated) {
        throw new Error('Job updated successfully but failed to reload record');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update job', { jobIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Submit job application with duplicate application prevention (UQ_JobApplications constraint)
   */
  async applyForJob(jobIdStr: string, requestingUserId: string, input: ApplyJobInput): Promise<ApplicationDetail> {
    const applicantUserId = await resolveDbUserId(requestingUserId);
    if (!applicantUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    const job = await this.getJobById(jobIdStr);
    if (!job) {
      throw new Error('JOB_NOT_FOUND');
    }
    if (!job.isActive || job.status !== 'OPEN') {
      throw new Error('JOB_CLOSED');
    }

    const numericJobId = parseInt(job.id, 10);

    // Duplicate application check
    const dupCheck = await databaseService.query<any>(
      'SELECT TOP 1 ApplicationId FROM JobApplications WHERE JobId = @jId AND ApplicantUserId = @appUserId',
      [
        { name: 'jId', type: mssql.BigInt(), value: numericJobId },
        { name: 'appUserId', type: mssql.BigInt(), value: applicantUserId },
      ]
    );

    if (dupCheck.recordset && dupCheck.recordset.length > 0) {
      throw new Error(`ALREADY_APPLIED: You have already applied for position "${job.title}"`);
    }

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO JobApplications (
           JobId, ApplicantUserId, CoverLetter, ResumeUrl, ExpectedSalary,
           NoticePeriodDays, Status, AppliedAt
         )
         OUTPUT INSERTED.ApplicationId
         VALUES (
           @jId, @appUserId, @cover, @resume, @expSal,
           @notice, 'SUBMITTED', CURRENT_TIMESTAMP
         )`,
        [
          { name: 'jId', type: mssql.BigInt(), value: numericJobId },
          { name: 'appUserId', type: mssql.BigInt(), value: applicantUserId },
          { name: 'cover', type: mssql.NVarChar(mssql.MAX), value: input.coverNote || input.coverLetter || 'Strong background matching position requirements.' },
          { name: 'resume', type: mssql.NVarChar(1000), value: input.resumeUrl || 'https://ecosphere.app/resumes/candidate.pdf' },
          { name: 'expSal', type: mssql.Decimal(18, 2), value: input.expectedSalary || job.salaryMin || 500000 },
          { name: 'notice', type: mssql.Int(), value: input.noticePeriodDays || 30 },
        ]
      );

      const createdAppId = Number(insertRes.recordset[0].ApplicationId);

      const appRes = await databaseService.query<any>(
        `SELECT 
           ja.ApplicationId, ja.JobId, ja.ApplicantUserId, ja.ResumeUrl, ja.CoverLetter,
           ja.ExpectedSalary, ja.NoticePeriodDays, ja.Status, ja.AppliedAt,
           j.JobTitle, b.BusinessName,
           uEmp.FirstName AS EmployerFirstName, uEmp.LastName AS EmployerLastName,
           uApp.FirstName AS ApplicantFirstName, uApp.LastName AS ApplicantLastName,
           uApp.Email AS ApplicantEmail, uApp.Mobile AS ApplicantMobile
         FROM JobApplications ja
         INNER JOIN Jobs j ON ja.JobId = j.JobId
         LEFT JOIN Businesses b ON j.BusinessId = b.BusinessId
         INNER JOIN Users uEmp ON j.EmployerUserId = uEmp.UserId
         INNER JOIN Users uApp ON ja.ApplicantUserId = uApp.UserId
         WHERE ja.ApplicationId = @appId`,
        [{ name: 'appId', type: mssql.BigInt(), value: createdAppId }]
      );

      const createdApp = mapDbRowToApplication(appRes.recordset[0]);

      // Notify employer of new application
      notificationService.createNotification({
        userId: Number(job.employerUserId),
        notificationType: 'JOB_MATCH',
        title: 'New Job Application Received',
        message: `New candidate application received for position "${job.title}".`,
        referenceType: 'JobApplication',
        referenceId: createdApp.id,
      }).catch((e) => logger.warn('Job apply notification error', { error: (e as Error).message }));

      return createdApp;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('UQ_JobApplications')) {
        throw new Error(`ALREADY_APPLIED: You have already applied for position "${job.title}"`);
      }
      logger.error('Failed to submit job application', { jobIdStr, requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch authenticated candidate's submitted applications
   */
  async getMyApplications(requestingUserId: string): Promise<ApplicationDetail[]> {
    const applicantUserId = await resolveDbUserId(requestingUserId);
    if (!applicantUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const appsRes = await databaseService.query<any>(
        `SELECT 
           ja.ApplicationId, ja.JobId, ja.ApplicantUserId, ja.ResumeUrl, ja.CoverLetter,
           ja.ExpectedSalary, ja.NoticePeriodDays, ja.Status, ja.AppliedAt,
           j.JobTitle, b.BusinessName,
           uEmp.FirstName AS EmployerFirstName, uEmp.LastName AS EmployerLastName,
           uApp.FirstName AS ApplicantFirstName, uApp.LastName AS ApplicantLastName,
           uApp.Email AS ApplicantEmail, uApp.Mobile AS ApplicantMobile
         FROM JobApplications ja
         INNER JOIN Jobs j ON ja.JobId = j.JobId
         LEFT JOIN Businesses b ON j.BusinessId = b.BusinessId
         INNER JOIN Users uEmp ON j.EmployerUserId = uEmp.UserId
         INNER JOIN Users uApp ON ja.ApplicantUserId = uApp.UserId
         WHERE ja.ApplicantUserId = @appUserId
         ORDER BY ja.ApplicationId DESC`,
        [{ name: 'appUserId', type: mssql.BigInt(), value: applicantUserId }]
      );

      return (appsRes.recordset || []).map(mapDbRowToApplication);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query customer job applications', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch applications for employer's jobs with strict employer ownership authorization
   */
  async getJobApplications(
    requestingUserId: string,
    requestingRole: string,
    targetJobIdStr?: string
  ): Promise<ApplicationDetail[]> {
    const employerUserId = await resolveDbUserId(requestingUserId);
    if (!employerUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    let filterJobId: number | null = null;
    if (targetJobIdStr) {
      const pJob = parseInt(targetJobIdStr.replace(/\D/g, ''), 10);
      if (!isNaN(pJob)) filterJobId = pJob;
    }

    if (filterJobId && requestingRole !== 'administrator') {
      // Verify employer owns target job
      const checkRes = await databaseService.query<any>(
        'SELECT 1 FROM Jobs WHERE JobId = @jId AND EmployerUserId = @empUserId',
        [
          { name: 'jId', type: mssql.BigInt(), value: filterJobId },
          { name: 'empUserId', type: mssql.BigInt(), value: employerUserId },
        ]
      );
      if (!checkRes.recordset || checkRes.recordset.length === 0) {
        throw new Error('FORBIDDEN_JOB_ACCESS');
      }
    }

    try {
      const whereSql = filterJobId
        ? 'WHERE ja.JobId = @jId'
        : (requestingRole === 'administrator' ? '' : 'WHERE j.EmployerUserId = @empUserId');

      const params: { name: string; type: any; value: any }[] = [];
      if (filterJobId) {
        params.push({ name: 'jId', type: mssql.BigInt(), value: filterJobId });
      } else if (requestingRole !== 'administrator') {
        params.push({ name: 'empUserId', type: mssql.BigInt(), value: employerUserId });
      }

      const appsRes = await databaseService.query<any>(
        `SELECT 
           ja.ApplicationId, ja.JobId, ja.ApplicantUserId, ja.ResumeUrl, ja.CoverLetter,
           ja.ExpectedSalary, ja.NoticePeriodDays, ja.Status, ja.AppliedAt,
           j.JobTitle, b.BusinessName,
           uEmp.FirstName AS EmployerFirstName, uEmp.LastName AS EmployerLastName,
           uApp.FirstName AS ApplicantFirstName, uApp.LastName AS ApplicantLastName,
           uApp.Email AS ApplicantEmail, uApp.Mobile AS ApplicantMobile
         FROM JobApplications ja
         INNER JOIN Jobs j ON ja.JobId = j.JobId
         LEFT JOIN Businesses b ON j.BusinessId = b.BusinessId
         INNER JOIN Users uEmp ON j.EmployerUserId = uEmp.UserId
         INNER JOIN Users uApp ON ja.ApplicantUserId = uApp.UserId
         ${whereSql}
         ORDER BY ja.ApplicationId DESC`,
        params
      );

      return (appsRes.recordset || []).map(mapDbRowToApplication);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'FORBIDDEN_JOB_ACCESS') throw err;
      logger.error('Failed to query employer job applications', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Update job application status with employer ownership authorization
   */
  async updateApplicationStatus(
    applicationIdStr: string,
    requestingUserId: string,
    requestingRole: string,
    newStatus: string
  ): Promise<ApplicationDetail> {
    const numericAppId = parseInt(applicationIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericAppId)) {
      throw new Error('APPLICATION_NOT_FOUND');
    }

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED'];
    const formattedStatus = newStatus.toUpperCase().trim();
    if (!validStatuses.includes(formattedStatus)) {
      throw new Error(`INVALID_STATUS: Valid statuses are ${validStatuses.join(', ')}`);
    }

    const dbUserId = await resolveDbUserId(requestingUserId);

    // Verify application exists and employer owns the associated job
    const checkRes = await databaseService.query<any>(
      `SELECT ja.ApplicationId, j.EmployerUserId 
       FROM JobApplications ja
       INNER JOIN Jobs j ON ja.JobId = j.JobId
       WHERE ja.ApplicationId = @appId`,
      [{ name: 'appId', type: mssql.BigInt(), value: numericAppId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('APPLICATION_NOT_FOUND');
    }

    const isOwner = Number(checkRes.recordset[0].EmployerUserId) === dbUserId;
    const isAdmin = requestingRole === 'administrator';

    if (!isOwner && !isAdmin) {
      throw new Error('FORBIDDEN_APPLICATION_ACCESS');
    }

    try {
      await databaseService.query(
        'UPDATE JobApplications SET Status = @status, UpdatedAt = CURRENT_TIMESTAMP WHERE ApplicationId = @appId',
        [
          { name: 'status', type: mssql.VarChar(40), value: formattedStatus },
          { name: 'appId', type: mssql.BigInt(), value: numericAppId },
        ]
      );

      const appRes = await databaseService.query<any>(
        `SELECT 
           ja.ApplicationId, ja.JobId, ja.ApplicantUserId, ja.ResumeUrl, ja.CoverLetter,
           ja.ExpectedSalary, ja.NoticePeriodDays, ja.Status, ja.AppliedAt,
           j.JobTitle, b.BusinessName,
           uEmp.FirstName AS EmployerFirstName, uEmp.LastName AS EmployerLastName,
           uApp.FirstName AS ApplicantFirstName, uApp.LastName AS ApplicantLastName,
           uApp.Email AS ApplicantEmail, uApp.Mobile AS ApplicantMobile
         FROM JobApplications ja
         INNER JOIN Jobs j ON ja.JobId = j.JobId
         LEFT JOIN Businesses b ON j.BusinessId = b.BusinessId
         INNER JOIN Users uEmp ON j.EmployerUserId = uEmp.UserId
         INNER JOIN Users uApp ON ja.ApplicantUserId = uApp.UserId
         WHERE ja.ApplicationId = @appId`,
        [{ name: 'appId', type: mssql.BigInt(), value: numericAppId }]
      );

      const updatedApp = mapDbRowToApplication(appRes.recordset[0]);

      // Notify applicant of status update
      notificationService.createNotification({
        userId: Number(updatedApp.applicantUserId),
        notificationType: 'JOB_MATCH',
        title: 'Job Application Status Updated',
        message: `Your application for position "${updatedApp.jobTitle}" has been updated to ${updatedApp.status}.`,
        referenceType: 'JobApplication',
        referenceId: updatedApp.id,
      }).catch((e) => logger.warn('Job application status notification error', { error: (e as Error).message }));

      return updatedApp;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update application status', { applicationIdStr, newStatus, error: err.message });
      throw err;
    }
  },
};
