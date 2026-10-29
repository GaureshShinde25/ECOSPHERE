import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

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
}

export interface OpportunityFilterOptions {
  userIdStr?: string;
  type?: OpportunityType;
  city?: string;
  limit?: number;
}

async function resolveUserContext(userIdStr?: string): Promise<{ dbUserId: number; city: string; area: string }> {
  if (!userIdStr) return { dbUserId: 0, city: 'Kolkata', area: 'Central' };

  const directId = parseInt(userIdStr, 10);
  let userRow: any = null;

  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    const res = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE UserId = @numId',
      [{ name: 'numId', type: mssql.BigInt(), value: directId }]
    );
    userRow = res.recordset?.[0];
  }

  if (!userRow) {
    const cleanMobile = userIdStr.replace(/\D/g, '');
    const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;
    if (searchMobile) {
      const res = await databaseService.query<any>(
        'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE Mobile = @exactMobile OR Mobile = @mobile',
        [
          { name: 'exactMobile', type: mssql.NVarChar(50), value: userIdStr },
          { name: 'mobile', type: mssql.NVarChar(50), value: searchMobile },
        ]
      );
      userRow = res.recordset?.[0];
    }
  }

  return {
    dbUserId: userRow ? Number(userRow.UserId) : 0,
    city: 'Kolkata',
    area: 'Central',
  };
}

function calculateScore(params: {
  relevance: number;
  demand: number;
  locationFit: number;
  recency: number;
  confidence: number;
}): number {
  const weighted =
    params.relevance * 0.35 +
    params.demand * 0.25 +
    params.locationFit * 0.20 +
    params.recency * 0.10 +
    params.confidence * 10;
  return Math.min(99, Math.max(50, Math.round(weighted)));
}

export const opportunityEngineService = {
  async getOpportunities(options: OpportunityFilterOptions): Promise<{
    opportunities: OpportunityItem[];
    total: number;
    userContext: { city: string; area: string };
  }> {
    const userCtx = await resolveUserContext(options.userIdStr);
    const filterCity = options.city || userCtx.city;
    const limit = Math.min(50, Math.max(1, options.limit || 10));

    try {
      // Parallelize candidate generation sub-queries across database entities
      const [jobsRes, servicesRes, businessesRes, ordersRes, bookingsRes] = await Promise.all([
        // 1. Active Jobs Candidate Generator
        databaseService.query<any>(
          `SELECT TOP 10 
             j.JobId, j.JobTitle, j.Description, j.SalaryMin, j.SalaryMax, j.JobType, j.CreatedAt,
             b.City, b.State, b.BusinessName,
             u.FirstName, u.LastName
           FROM Jobs j WITH (NOLOCK)
           LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
           LEFT JOIN Users u WITH (NOLOCK) ON j.EmployerUserId = u.UserId
           WHERE j.IsActive = 1
           ORDER BY j.JobId DESC`
        ),
        // 2. High-Rating Local Services Candidate Generator
        databaseService.query<any>(
          `SELECT TOP 10 
             s.ServiceId, s.ServiceName, s.Description, s.Price, s.DurationMinutes, s.CreatedAt,
             b.BusinessId, b.BusinessName, b.City, b.Rating, b.ReviewCount
           FROM Services s WITH (NOLOCK)
           INNER JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
           WHERE s.IsActive = 1
           ORDER BY s.ServiceId DESC`
        ),
        // 3. Local Business Collaboration Candidates
        databaseService.query<any>(
          `SELECT TOP 10 
             b.BusinessId, b.BusinessName, b.City, b.VerificationStatus, b.Rating, b.ReviewCount, b.CreatedAt
           FROM Businesses b WITH (NOLOCK)
           WHERE b.IsActive = 1
           ORDER BY b.BusinessId DESC`
        ),
        // 4. Demand Signals from Active Product Orders
        databaseService.query<any>(
          `SELECT TOP 5 
             b.BusinessId, b.BusinessName, COUNT(o.OrderId) AS OrderCount, SUM(o.TotalAmount) AS TotalRevenue
           FROM Orders o WITH (NOLOCK)
           INNER JOIN Businesses b WITH (NOLOCK) ON o.BusinessId = b.BusinessId
           GROUP BY b.BusinessId, b.BusinessName
           ORDER BY OrderCount DESC`
        ),
        // 5. Gig/Service Booking Volume Demand Signals
        databaseService.query<any>(
          `SELECT TOP 5 
             s.ServiceId, s.ServiceName, COUNT(bk.BookingId) AS BookingCount, SUM(bk.Amount) AS TotalVolume
           FROM Bookings bk WITH (NOLOCK)
           INNER JOIN Services s WITH (NOLOCK) ON bk.ServiceId = s.ServiceId
           GROUP BY s.ServiceId, s.ServiceName
           ORDER BY BookingCount DESC`
        ),
      ]);

      const candidates: OpportunityItem[] = [];

      // A. Generate JOB Opportunities
      for (const row of jobsRes.recordset || []) {
        const jobCity = row.City || filterCity;
        const isLocal = jobCity.toLowerCase().includes(filterCity.toLowerCase());
        const relevance = isLocal ? 90 : 70;
        const locationFit = isLocal ? 100 : 60;
        const demand = 80;
        const recency = 85;
        const confidence = 0.95;
        const score = calculateScore({ relevance, demand, locationFit, recency, confidence });

        const salaryStr = row.SalaryMax ? `₹${row.SalaryMin || 0} - ₹${row.SalaryMax}/mo` : 'Competitive Compensation';
        const employer = row.BusinessName || `${row.FirstName || ''} ${row.LastName || ''}`.trim() || 'Verified Employer';

        candidates.push({
          id: `opp-job-${row.JobId}`,
          type: 'JOB',
          title: `Position: ${row.JobTitle}`,
          description: `Active ${row.JobType || 'full-time'} opening posted by ${employer} offering ${salaryStr}.`,
          score,
          confidence,
          relevance,
          reason: `Matching job vacancy available in ${jobCity} with ${row.JobType || 'standard'} terms.`,
          sourceEntities: [{ entityType: 'Job', entityId: String(row.JobId), name: row.JobTitle }],
          location: { city: jobCity },
          estimatedValue: Number(row.SalaryMax || row.SalaryMin || 25000),
          createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
          actionScreen: 'JobDetailsScreen',
          actionParams: { jobId: String(row.JobId) },
        });
      }

      // B. Generate SERVICE & GIG Opportunities
      for (const row of servicesRes.recordset || []) {
        const isLocalCity = row.City && row.City.toLowerCase().includes(filterCity.toLowerCase());
        const relevance = isLocalCity ? 95 : 75;
        const locationFit = isLocalCity ? 100 : 70;
        const demand = Math.min(100, (Number(row.ReviewCount || 0) * 10) + 50);
        const recency = 90;
        const confidence = 0.95;
        const score = calculateScore({ relevance, demand, locationFit, recency, confidence });

        candidates.push({
          id: `opp-service-${row.ServiceId}`,
          type: 'SERVICE',
          title: `Local Service: ${row.ServiceName}`,
          description: `Provided by ${row.BusinessName} (${row.Rating || 4.5}★ rating) for ₹${row.Price || 499}.`,
          score,
          confidence,
          relevance,
          reason: `High customer satisfaction rating (${row.Rating || 4.5}★) with ${row.ReviewCount || 5}+ reviews in ${row.City || filterCity}.`,
          sourceEntities: [
            { entityType: 'Service', entityId: String(row.ServiceId), name: row.ServiceName },
            { entityType: 'Business', entityId: String(row.BusinessId), name: row.BusinessName },
          ],
          location: { city: row.City || filterCity, area: row.Area || 'Central' },
          estimatedValue: Number(row.Price || 499),
          createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
          actionScreen: 'ServiceDetailScreen',
          actionParams: { serviceId: String(row.ServiceId) },
        });
      }

      // C. Generate DEMAND Opportunities from Booking Volume
      for (const row of bookingsRes.recordset || []) {
        const count = Number(row.BookingCount || 0);
        const volume = Number(row.TotalVolume || 0);
        const score = calculateScore({ relevance: 85, demand: Math.min(100, count * 20), locationFit: 90, recency: 90, confidence: 0.95 });

        candidates.push({
          id: `opp-demand-bk-${row.ServiceId}`,
          type: 'DEMAND',
          title: `Surge Demand: ${row.ServiceName}`,
          description: `${count} confirmed service bookings generated ₹${volume.toLocaleString('en-IN')} in total activity.`,
          score,
          confidence: 0.95,
          relevance: 85,
          reason: `High customer booking velocity (${count} active bookings) in your area.`,
          sourceEntities: [{ entityType: 'Service', entityId: String(row.ServiceId), name: row.ServiceName }],
          location: { city: filterCity },
          estimatedValue: volume,
          createdAt: new Date().toISOString(),
          actionScreen: 'ServiceDetailScreen',
          actionParams: { serviceId: String(row.ServiceId) },
        });
      }

      // D. Generate COLLABORATION Opportunities
      for (const row of businessesRes.recordset || []) {
        const score = calculateScore({ relevance: 80, demand: 75, locationFit: 90, recency: 80, confidence: 0.90 });

        candidates.push({
          id: `opp-collab-${row.BusinessId}`,
          type: 'COLLABORATION',
          title: `Partner Opportunity: ${row.BusinessName}`,
          description: `Verified local provider in ${row.City || filterCity} with ${row.ReviewCount || 0} customer reviews.`,
          score,
          confidence: 0.90,
          relevance: 80,
          reason: `Verified business status in ${row.City || filterCity} suitable for cross-service collaboration.`,
          sourceEntities: [{ entityType: 'Business', entityId: String(row.BusinessId), name: row.BusinessName }],
          location: { city: row.City || filterCity },
          createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
          actionScreen: 'BusinessProfileScreen',
          actionParams: { businessId: String(row.BusinessId) },
        });
      }

      // Filter by requested opportunity type if specified
      let filtered = candidates;
      if (options.type) {
        filtered = candidates.filter((item) => item.type === options.type);
      }

      // Sort by Opportunity Score descending
      filtered.sort((a, b) => b.score - a.score);

      // Apply pagination limit
      const paginated = filtered.slice(0, limit);

      return {
        opportunities: paginated,
        total: filtered.length,
        userContext: { city: filterCity, area: userCtx.area },
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to generate AI opportunities', { error: err.message, options });
      throw err;
    }
  },
};
