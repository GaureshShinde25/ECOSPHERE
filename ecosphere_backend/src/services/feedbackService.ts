import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export type FeedbackConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_EVIDENCE';

export interface JobOutcomeFeedback {
  categoryName: string;
  applicationCount: number;
  shortlistedCount: number;
  rejectedCount: number;
  underReviewCount: number;
  submittedCount: number;
  shortlistRate: number; // shortlisted / applicationCount
  outcomeScore: number;  // 0-100 normalized score
  boost: number;         // bounded [-10, +10]
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface ServiceOutcomeFeedback {
  categoryName: string;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  confirmedCount: number;
  fulfillmentRate: number;   // completed / bookingCount
  cancellationRate: number;  // cancelled / bookingCount
  outcomeScore: number;     // 0-100 normalized score
  boost: number;            // bounded [-10, +10]
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface RetailOutcomeFeedback {
  categoryName: string;
  orderCount: number;
  deliveredCount: number;
  cancelledCount: number;
  shippedCount: number;
  processingCount: number;
  deliveryRate: number;      // delivered / orderCount
  cancellationRate: number;  // cancelled / orderCount
  outcomeScore: number;     // 0-100 normalized score
  boost: number;            // bounded [-10, +10]
  confidence: FeedbackConfidence;
  geographicScope: string;
  lastActivityAt?: string;
}

export interface FeedbackSummary {
  city: string;
  totalApplications: number;
  totalShortlisted: number;
  globalShortlistRate: number;
  totalBookings: number;
  totalCompletedBookings: number;
  globalFulfillmentRate: number;
  totalOrders: number;
  totalDeliveredOrders: number;
  globalDeliveryRate: number;
  averageBoost: number;
  evidenceStrength: 'STRONG' | 'MODERATE' | 'SPARSE';
  dataDepthNote: string;
  observedSignalsCount: number;
}

export interface OutcomeFeedbackResult {
  boost: number; // bounded [-10, +10]
  outcomeScore: number; // 0-100
  confidence: FeedbackConfidence;
  sampleSize: number;
  observedOutcome: string;
  evidenceCategory: string;
  geographicScope: string;
  metricName: string;
  metricValue: number;
  evidenceType: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
  reason: string;
  evidenceBreakdown?: Record<string, number | string>;
}

interface FeedbackCacheEntry<T> {
  data: T;
  cachedAt: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for high-throughput sub-10ms queries

/**
 * Determine sample confidence based on sample size thresholds.
 * Thresholds:
 *   < 5: INSUFFICIENT_EVIDENCE
 *   5 - 19: LOW
 *   20 - 49: MEDIUM
 *   >= 50: HIGH
 */
function evaluateConfidence(sampleSize: number): FeedbackConfidence {
  if (sampleSize < 5) return 'INSUFFICIENT_EVIDENCE';
  if (sampleSize < 20) return 'LOW';
  if (sampleSize < 50) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Clamp value within [-10, +10]
 */
function clampBoost(val: number): number {
  return Math.max(-10, Math.min(10, Math.round(val)));
}

/**
 * Economic Intelligence Feedback & Learning Engine (Phase 35)
 * Derives bounded, deterministic feedback from real observed transactions (JobApplications, Bookings, Orders).
 * ZERO SCHEMA CHANGES - ZERO ML BLACK-BOX - STRICT NON-CAUSALITY.
 */
class FeedbackService {
  private jobFeedbackCache = new Map<string, FeedbackCacheEntry<JobOutcomeFeedback[]>>();
  private serviceFeedbackCache = new Map<string, FeedbackCacheEntry<ServiceOutcomeFeedback[]>>();
  private retailFeedbackCache = new Map<string, FeedbackCacheEntry<RetailOutcomeFeedback[]>>();
  private summaryCache = new Map<string, FeedbackCacheEntry<FeedbackSummary>>();

  /**
   * Clear all in-memory feedback caches
   */
  public clearCache(): void {
    this.jobFeedbackCache.clear();
    this.serviceFeedbackCache.clear();
    this.retailFeedbackCache.clear();
    this.summaryCache.clear();
  }

  /**
   * Calculate Job Category Outcome Feedback from JobApplications
   */
  public async getJobCategoryFeedback(city?: string): Promise<JobOutcomeFeedback[]> {
    const normalizedCity = city?.trim().toLowerCase() || '';
    const cacheKey = normalizedCity || '__ALL__';
    const cached = this.jobFeedbackCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const inputs: Array<{ name: string; type: any; value: any }> = [];
      let cityFilter = '';

      if (normalizedCity) {
        cityFilter = 'AND LOWER(b.City) = LOWER(@city)';
        inputs.push({ name: 'city', type: mssql.NVarChar(100), value: normalizedCity });
      }

      const query = `
        SELECT 
          jc.CategoryName,
          COUNT(ja.ApplicationId) AS applicationCount,
          SUM(CASE WHEN ja.Status = 'SHORTLISTED' THEN 1 ELSE 0 END) AS shortlistedCount,
          SUM(CASE WHEN ja.Status = 'REJECTED' THEN 1 ELSE 0 END) AS rejectedCount,
          SUM(CASE WHEN ja.Status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) AS underReviewCount,
          SUM(CASE WHEN ja.Status = 'SUBMITTED' THEN 1 ELSE 0 END) AS submittedCount,
          MAX(ja.AppliedAt) AS lastActivityAt
        FROM JobCategories jc WITH (NOLOCK)
        LEFT JOIN Jobs j WITH (NOLOCK) ON jc.JobCategoryId = j.JobCategoryId
        LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
        LEFT JOIN JobApplications ja WITH (NOLOCK) ON j.JobId = ja.JobId
        WHERE 1=1 ${cityFilter}
        GROUP BY jc.CategoryName
        ORDER BY applicationCount DESC
      `;

      const result = await databaseService.query<any>(query, inputs);
      const rows = result.recordset || [];

      const feedbacks: JobOutcomeFeedback[] = rows.map((r: any) => {
        const appCount = Number(r.applicationCount || 0);
        const shortCount = Number(r.shortlistedCount || 0);
        const rejCount = Number(r.rejectedCount || 0);
        const underRevCount = Number(r.underReviewCount || 0);
        const subCount = Number(r.submittedCount || 0);
        const confidence = evaluateConfidence(appCount);

        let shortlistRate = 0;
        let boost = 0;
        let outcomeScore = 50; // Neutral base

        if (appCount >= 5) {
          shortlistRate = Number((shortCount / appCount).toFixed(4));
          // Benchmark platform baseline shortlist rate is ~0.25 (25%)
          const delta = shortlistRate - 0.25;
          if (Math.abs(delta) < 0.008) {
            boost = 0;
          } else if (delta > 0) {
            boost = clampBoost(Math.max(1, Math.round(delta * 40)));
          } else {
            boost = clampBoost(Math.min(-1, Math.round(delta * 40)));
          }
          outcomeScore = Math.max(0, Math.min(100, Math.round(50 + boost * 5)));
        }

        return {
          categoryName: r.CategoryName,
          applicationCount: appCount,
          shortlistedCount: shortCount,
          rejectedCount: rejCount,
          underReviewCount: underRevCount,
          submittedCount: subCount,
          shortlistRate,
          outcomeScore,
          boost,
          confidence,
          geographicScope: normalizedCity ? city!.trim() : 'GLOBAL',
          lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt).toISOString() : undefined,
        };
      });

      this.jobFeedbackCache.set(cacheKey, { data: feedbacks, cachedAt: Date.now() });
      return feedbacks;
    } catch (err) {
      logger.error('Error computing job category feedback', { err, city });
      throw err;
    }
  }

  /**
   * Calculate Service Category Fulfillment Feedback from Bookings
   */
  public async getServiceCategoryFeedback(city?: string): Promise<ServiceOutcomeFeedback[]> {
    const normalizedCity = city?.trim().toLowerCase() || '';
    const cacheKey = normalizedCity || '__ALL__';
    const cached = this.serviceFeedbackCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const inputs: Array<{ name: string; type: any; value: any }> = [];
      let cityFilter = '';

      if (normalizedCity) {
        // Bookings can be filtered by CustomerCity or Business City
        cityFilter = 'AND (LOWER(bk.CustomerCity) = LOWER(@city) OR LOWER(b.City) = LOWER(@city))';
        inputs.push({ name: 'city', type: mssql.NVarChar(100), value: normalizedCity });
      }

      const query = `
        SELECT 
          sc.CategoryName,
          COUNT(bk.BookingId) AS bookingCount,
          SUM(CASE WHEN bk.Status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedCount,
          SUM(CASE WHEN bk.Status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledCount,
          SUM(CASE WHEN bk.Status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
          SUM(CASE WHEN bk.Status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedCount,
          MAX(bk.CreatedAt) AS lastActivityAt
        FROM ServiceCategories sc WITH (NOLOCK)
        LEFT JOIN Services s WITH (NOLOCK) ON sc.ServiceCategoryId = s.ServiceCategoryId
        LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
        LEFT JOIN Bookings bk WITH (NOLOCK) ON s.ServiceId = bk.ServiceId
        WHERE 1=1 ${cityFilter}
        GROUP BY sc.CategoryName
        ORDER BY bookingCount DESC
      `;

      const result = await databaseService.query<any>(query, inputs);
      const rows = result.recordset || [];

      const feedbacks: ServiceOutcomeFeedback[] = rows.map((r: any) => {
        const bookCount = Number(r.bookingCount || 0);
        const compCount = Number(r.completedCount || 0);
        const cancCount = Number(r.cancelledCount || 0);
        const pendCount = Number(r.pendingCount || 0);
        const confCount = Number(r.confirmedCount || 0);
        const confidence = evaluateConfidence(bookCount);

        let fulfillmentRate = 0;
        let cancellationRate = 0;
        let boost = 0;
        let outcomeScore = 50;

        if (bookCount >= 5) {
          fulfillmentRate = Number((compCount / bookCount).toFixed(4));
          cancellationRate = Number((cancCount / bookCount).toFixed(4));
          // Net fulfillment performance: completed vs cancelled
          const netSpread = fulfillmentRate - cancellationRate;
          if (Math.abs(netSpread) < 0.008) {
            boost = 0;
          } else if (netSpread > 0) {
            boost = clampBoost(Math.max(1, Math.round(netSpread * 25)));
          } else {
            boost = clampBoost(Math.min(-1, Math.round(netSpread * 25)));
          }
          outcomeScore = Math.max(0, Math.min(100, Math.round(50 + boost * 5)));
        }

        return {
          categoryName: r.CategoryName,
          bookingCount: bookCount,
          completedCount: compCount,
          cancelledCount: cancCount,
          pendingCount: pendCount,
          confirmedCount: confCount,
          fulfillmentRate,
          cancellationRate,
          outcomeScore,
          boost,
          confidence,
          geographicScope: normalizedCity ? city!.trim() : 'GLOBAL',
          lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt).toISOString() : undefined,
        };
      });

      this.serviceFeedbackCache.set(cacheKey, { data: feedbacks, cachedAt: Date.now() });
      return feedbacks;
    } catch (err) {
      logger.error('Error computing service category feedback', { err, city });
      throw err;
    }
  }

  /**
   * Calculate Retail / Merchant Delivery Feedback from Orders
   */
  public async getRetailCategoryFeedback(city?: string): Promise<RetailOutcomeFeedback[]> {
    const normalizedCity = city?.trim().toLowerCase() || '';
    const cacheKey = normalizedCity || '__ALL__';
    const cached = this.retailFeedbackCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const inputs: Array<{ name: string; type: any; value: any }> = [];
      let cityFilter = '';

      if (normalizedCity) {
        cityFilter = 'AND (LOWER(b.City) = LOWER(@city) OR LOWER(o.ShippingCity) = LOWER(@city))';
        inputs.push({ name: 'city', type: mssql.NVarChar(100), value: normalizedCity });
      }

      const query = `
        SELECT 
          bc.CategoryName,
          COUNT(o.OrderId) AS orderCount,
          SUM(CASE WHEN o.OrderStatus = 'DELIVERED' THEN 1 ELSE 0 END) AS deliveredCount,
          SUM(CASE WHEN o.OrderStatus = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledCount,
          SUM(CASE WHEN o.OrderStatus = 'SHIPPED' THEN 1 ELSE 0 END) AS shippedCount,
          SUM(CASE WHEN o.OrderStatus = 'PROCESSING' THEN 1 ELSE 0 END) AS processingCount,
          MAX(o.CreatedAt) AS lastActivityAt
        FROM BusinessCategories bc WITH (NOLOCK)
        LEFT JOIN Businesses b WITH (NOLOCK) ON bc.CategoryId = b.CategoryId
        LEFT JOIN Orders o WITH (NOLOCK) ON b.BusinessId = o.BusinessId
        WHERE 1=1 ${cityFilter}
        GROUP BY bc.CategoryName
        ORDER BY orderCount DESC
      `;

      const result = await databaseService.query<any>(query, inputs);
      const rows = result.recordset || [];

      const feedbacks: RetailOutcomeFeedback[] = rows.map((r: any) => {
        const ordCount = Number(r.orderCount || 0);
        const delCount = Number(r.deliveredCount || 0);
        const cancCount = Number(r.cancelledCount || 0);
        const shipCount = Number(r.shippedCount || 0);
        const procCount = Number(r.processingCount || 0);
        const confidence = evaluateConfidence(ordCount);

        let deliveryRate = 0;
        let cancellationRate = 0;
        let boost = 0;
        let outcomeScore = 50;

        if (ordCount >= 5) {
          deliveryRate = Number((delCount / ordCount).toFixed(4));
          cancellationRate = Number((cancCount / ordCount).toFixed(4));
          const netSpread = deliveryRate - cancellationRate;
          if (Math.abs(netSpread) < 0.008) {
            boost = 0;
          } else if (netSpread > 0) {
            boost = clampBoost(Math.max(1, Math.round(netSpread * 25)));
          } else {
            boost = clampBoost(Math.min(-1, Math.round(netSpread * 25)));
          }
          outcomeScore = Math.max(0, Math.min(100, Math.round(50 + boost * 5)));
        }

        return {
          categoryName: r.CategoryName,
          orderCount: ordCount,
          deliveredCount: delCount,
          cancelledCount: cancCount,
          shippedCount: shipCount,
          processingCount: procCount,
          deliveryRate,
          cancellationRate,
          outcomeScore,
          boost,
          confidence,
          geographicScope: normalizedCity ? city!.trim() : 'GLOBAL',
          lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt).toISOString() : undefined,
        };
      });

      this.retailFeedbackCache.set(cacheKey, { data: feedbacks, cachedAt: Date.now() });
      return feedbacks;
    } catch (err) {
      logger.error('Error computing retail category feedback', { err, city });
      throw err;
    }
  }

  /**
   * Get high-level Feedback Summary across domains
   */
  public async getFeedbackSummary(city?: string): Promise<FeedbackSummary> {
    const normalizedCity = city?.trim().toLowerCase() || '';
    const cacheKey = normalizedCity || '__ALL__';
    const cached = this.summaryCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    const [jobs, services, retail] = await Promise.all([
      this.getJobCategoryFeedback(city),
      this.getServiceCategoryFeedback(city),
      this.getRetailCategoryFeedback(city),
    ]);

    const totalApplications = jobs.reduce((acc, j) => acc + j.applicationCount, 0);
    const totalShortlisted = jobs.reduce((acc, j) => acc + j.shortlistedCount, 0);
    const globalShortlistRate = totalApplications > 0
      ? Number((totalShortlisted / totalApplications).toFixed(4))
      : 0;

    const totalBookings = services.reduce((acc, s) => acc + s.bookingCount, 0);
    const totalCompletedBookings = services.reduce((acc, s) => acc + s.completedCount, 0);
    const globalFulfillmentRate = totalBookings > 0
      ? Number((totalCompletedBookings / totalBookings).toFixed(4))
      : 0;

    const totalOrders = retail.reduce((acc, r) => acc + r.orderCount, 0);
    const totalDeliveredOrders = retail.reduce((acc, r) => acc + r.deliveredCount, 0);
    const globalDeliveryRate = totalOrders > 0
      ? Number((totalDeliveredOrders / totalOrders).toFixed(4))
      : 0;

    const allBoosts = [
      ...jobs.filter((j) => j.confidence !== 'INSUFFICIENT_EVIDENCE').map((j) => j.boost),
      ...services.filter((s) => s.confidence !== 'INSUFFICIENT_EVIDENCE').map((s) => s.boost),
      ...retail.filter((r) => r.confidence !== 'INSUFFICIENT_EVIDENCE').map((r) => r.boost),
    ];

    const averageBoost = allBoosts.length > 0
      ? Number((allBoosts.reduce((a, b) => a + b, 0) / allBoosts.length).toFixed(2))
      : 0;

    const totalTransactions = totalApplications + totalBookings + totalOrders;
    let evidenceStrength: 'STRONG' | 'MODERATE' | 'SPARSE' = 'SPARSE';
    if (totalTransactions >= 100) {
      evidenceStrength = 'STRONG';
    } else if (totalTransactions >= 20) {
      evidenceStrength = 'MODERATE';
    }

    const summary: FeedbackSummary = {
      city: city?.trim() || 'GLOBAL',
      totalApplications,
      totalShortlisted,
      globalShortlistRate,
      totalBookings,
      totalCompletedBookings,
      globalFulfillmentRate,
      totalOrders,
      totalDeliveredOrders,
      globalDeliveryRate,
      averageBoost,
      evidenceStrength,
      dataDepthNote: 'Transactional outcome telemetry based on active marketplace records. Densest telemetry captured around baseline snapshot window (August–September 2026). Non-causal observed outcomes only.',
      observedSignalsCount: totalTransactions,
    };

    this.summaryCache.set(cacheKey, { data: summary, cachedAt: Date.now() });
    return summary;
  }

  /**
   * Calculate specific OutcomeFeedbackResult for an opportunity or category.
   * Supports geographic isolation with fallback:
   *   1. city + category (if sample >= 5)
   *   2. global category (if sample >= 5)
   *   3. zero boost / INSUFFICIENT_EVIDENCE (if sample < 5)
   */
  public async getOutcomeFeedbackForCategory(
    category: string,
    entityType: 'JOB' | 'SERVICE' | 'RETAIL',
    city?: string
  ): Promise<OutcomeFeedbackResult> {
    const cleanCat = category.trim().toLowerCase();

    if (entityType === 'JOB') {
      // 1. Try city-specific if city provided
      if (city) {
        const cityJobs = await this.getJobCategoryFeedback(city);
        const match = cityJobs.find((j) => j.categoryName.toLowerCase() === cleanCat);
        if (match && match.applicationCount >= 5) {
          return {
            boost: match.boost,
            outcomeScore: match.outcomeScore,
            confidence: match.confidence,
            sampleSize: match.applicationCount,
            observedOutcome: `${match.shortlistedCount} shortlisted from ${match.applicationCount} applications`,
            evidenceCategory: match.categoryName,
            geographicScope: match.geographicScope,
            metricName: 'shortlistRate',
            metricValue: match.shortlistRate,
            evidenceType: 'OBSERVED',
            reason: `Observed transactional outcome: ${(match.shortlistRate * 100).toFixed(1)}% shortlist rate across ${match.applicationCount} applications in ${match.categoryName} (${match.geographicScope})`,
            evidenceBreakdown: {
              shortlisted: match.shortlistedCount,
              totalApplications: match.applicationCount,
              shortlistRate: match.shortlistRate,
            },
          };
        }
      }

      // 2. Fallback to Global
      const globalJobs = await this.getJobCategoryFeedback();
      const match = globalJobs.find((j) => j.categoryName.toLowerCase() === cleanCat);
      if (match && match.applicationCount >= 5) {
        return {
          boost: match.boost,
          outcomeScore: match.outcomeScore,
          confidence: match.confidence,
          sampleSize: match.applicationCount,
          observedOutcome: `${match.shortlistedCount} shortlisted from ${match.applicationCount} applications`,
          evidenceCategory: match.categoryName,
          geographicScope: 'GLOBAL',
          metricName: 'shortlistRate',
          metricValue: match.shortlistRate,
          evidenceType: 'OBSERVED',
          reason: `Observed transactional outcome: ${(match.shortlistRate * 100).toFixed(1)}% shortlist rate across ${match.applicationCount} applications in ${match.categoryName} (Platform-wide)`,
          evidenceBreakdown: {
            shortlisted: match.shortlistedCount,
            totalApplications: match.applicationCount,
            shortlistRate: match.shortlistRate,
          },
        };
      }
    } else if (entityType === 'SERVICE') {
      // 1. Try city-specific
      if (city) {
        const cityServices = await this.getServiceCategoryFeedback(city);
        const match = cityServices.find((s) => s.categoryName.toLowerCase() === cleanCat);
        if (match && match.bookingCount >= 5) {
          return {
            boost: match.boost,
            outcomeScore: match.outcomeScore,
            confidence: match.confidence,
            sampleSize: match.bookingCount,
            observedOutcome: `${match.completedCount} completed bookings out of ${match.bookingCount} total`,
            evidenceCategory: match.categoryName,
            geographicScope: match.geographicScope,
            metricName: 'fulfillmentRate',
            metricValue: match.fulfillmentRate,
            evidenceType: 'OBSERVED',
            reason: `Observed transactional outcome: ${(match.fulfillmentRate * 100).toFixed(1)}% fulfillment rate across ${match.bookingCount} bookings in ${match.categoryName} (${match.geographicScope})`,
            evidenceBreakdown: {
              completedBookings: match.completedCount,
              cancelledBookings: match.cancelledCount,
              totalBookings: match.bookingCount,
              fulfillmentRate: match.fulfillmentRate,
            },
          };
        }
      }

      // 2. Fallback to Global
      const globalServices = await this.getServiceCategoryFeedback();
      const match = globalServices.find((s) => s.categoryName.toLowerCase() === cleanCat);
      if (match && match.bookingCount >= 5) {
        return {
          boost: match.boost,
          outcomeScore: match.outcomeScore,
          confidence: match.confidence,
          sampleSize: match.bookingCount,
          observedOutcome: `${match.completedCount} completed bookings out of ${match.bookingCount} total`,
          evidenceCategory: match.categoryName,
          geographicScope: 'GLOBAL',
          metricName: 'fulfillmentRate',
          metricValue: match.fulfillmentRate,
          evidenceType: 'OBSERVED',
          reason: `Observed transactional outcome: ${(match.fulfillmentRate * 100).toFixed(1)}% fulfillment rate across ${match.bookingCount} bookings in ${match.categoryName} (Platform-wide)`,
          evidenceBreakdown: {
            completedBookings: match.completedCount,
            cancelledBookings: match.cancelledCount,
            totalBookings: match.bookingCount,
            fulfillmentRate: match.fulfillmentRate,
          },
        };
      }
    } else if (entityType === 'RETAIL') {
      // 1. Try city-specific
      if (city) {
        const cityRetail = await this.getRetailCategoryFeedback(city);
        const match = cityRetail.find((r) => r.categoryName.toLowerCase() === cleanCat);
        if (match && match.orderCount >= 5) {
          return {
            boost: match.boost,
            outcomeScore: match.outcomeScore,
            confidence: match.confidence,
            sampleSize: match.orderCount,
            observedOutcome: `${match.deliveredCount} delivered orders out of ${match.orderCount} total`,
            evidenceCategory: match.categoryName,
            geographicScope: match.geographicScope,
            metricName: 'deliveryRate',
            metricValue: match.deliveryRate,
            evidenceType: 'OBSERVED',
            reason: `Observed transactional outcome: ${(match.deliveryRate * 100).toFixed(1)}% delivery rate across ${match.orderCount} orders in ${match.categoryName} (${match.geographicScope})`,
            evidenceBreakdown: {
              deliveredOrders: match.deliveredCount,
              cancelledOrders: match.cancelledCount,
              totalOrders: match.orderCount,
              deliveryRate: match.deliveryRate,
            },
          };
        }
      }

      // 2. Fallback to Global
      const globalRetail = await this.getRetailCategoryFeedback();
      const match = globalRetail.find((r) => r.categoryName.toLowerCase() === cleanCat);
      if (match && match.orderCount >= 5) {
        return {
          boost: match.boost,
          outcomeScore: match.outcomeScore,
          confidence: match.confidence,
          sampleSize: match.orderCount,
          observedOutcome: `${match.deliveredCount} delivered orders out of ${match.orderCount} total`,
          evidenceCategory: match.categoryName,
          geographicScope: 'GLOBAL',
          metricName: 'deliveryRate',
          metricValue: match.deliveryRate,
          evidenceType: 'OBSERVED',
          reason: `Observed transactional outcome: ${(match.deliveryRate * 100).toFixed(1)}% delivery rate across ${match.orderCount} orders in ${match.categoryName} (Platform-wide)`,
          evidenceBreakdown: {
            deliveredOrders: match.deliveredCount,
            cancelledOrders: match.cancelledCount,
            totalOrders: match.orderCount,
            deliveryRate: match.deliveryRate,
          },
        };
      }
    }

    // 3. Fallback: Insufficient evidence
    return {
      boost: 0,
      outcomeScore: 50,
      confidence: 'INSUFFICIENT_EVIDENCE',
      sampleSize: 0,
      observedOutcome: 'Insufficient transactional evidence (sample < 5)',
      evidenceCategory: category,
      geographicScope: city || 'GLOBAL',
      metricName: 'none',
      metricValue: 0,
      evidenceType: 'INFERRED',
      reason: `Insufficient transactional evidence in ${category} (sample < 5). Neutral feedback boost applied.`,
    };
  }

  /**
   * Resolves category and calculates outcome boost for an individual Job or Service entity
   */
  public async getOutcomeFeedbackForEntity(
    entityType: 'JOB' | 'SERVICE' | 'BUSINESS',
    entityId: string | number,
    city?: string
  ): Promise<OutcomeFeedbackResult> {
    const idNum = Number(entityId);
    if (!idNum || isNaN(idNum)) {
      return {
        boost: 0,
        outcomeScore: 50,
        confidence: 'INSUFFICIENT_EVIDENCE',
        sampleSize: 0,
        observedOutcome: 'Invalid entity identifier',
        evidenceCategory: 'Unknown',
        geographicScope: city || 'GLOBAL',
        metricName: 'none',
        metricValue: 0,
        evidenceType: 'INFERRED',
        reason: 'Unable to resolve entity for outcome feedback.',
      };
    }

    try {
      if (entityType === 'JOB') {
        const res = await databaseService.query<any>(
          `SELECT TOP 1 jc.CategoryName, b.City
           FROM Jobs j WITH (NOLOCK)
           JOIN JobCategories jc WITH (NOLOCK) ON j.JobCategoryId = jc.JobCategoryId
           LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
           WHERE j.JobId = @id`,
          [{ name: 'id', type: mssql.BigInt(), value: idNum }]
        );
        if (res.recordset && res.recordset.length > 0) {
          const row = res.recordset[0];
          const targetCity = city || row.City;
          return this.getOutcomeFeedbackForCategory(row.CategoryName, 'JOB', targetCity);
        }
      } else if (entityType === 'SERVICE') {
        const res = await databaseService.query<any>(
          `SELECT TOP 1 sc.CategoryName, b.City
           FROM Services s WITH (NOLOCK)
           JOIN ServiceCategories sc WITH (NOLOCK) ON s.ServiceCategoryId = sc.ServiceCategoryId
           LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
           WHERE s.ServiceId = @id`,
          [{ name: 'id', type: mssql.BigInt(), value: idNum }]
        );
        if (res.recordset && res.recordset.length > 0) {
          const row = res.recordset[0];
          const targetCity = city || row.City;
          return this.getOutcomeFeedbackForCategory(row.CategoryName, 'SERVICE', targetCity);
        }
      } else if (entityType === 'BUSINESS') {
        const res = await databaseService.query<any>(
          `SELECT TOP 1 bc.CategoryName, b.City
           FROM Businesses b WITH (NOLOCK)
           JOIN BusinessCategories bc WITH (NOLOCK) ON b.CategoryId = bc.CategoryId
           WHERE b.BusinessId = @id`,
          [{ name: 'id', type: mssql.BigInt(), value: idNum }]
        );
        if (res.recordset && res.recordset.length > 0) {
          const row = res.recordset[0];
          const targetCity = city || row.City;
          return this.getOutcomeFeedbackForCategory(row.CategoryName, 'RETAIL', targetCity);
        }
      }
    } catch (err) {
      logger.error('Error fetching outcome feedback for entity', { entityType, entityId, err });
    }

    return {
      boost: 0,
      outcomeScore: 50,
      confidence: 'INSUFFICIENT_EVIDENCE',
      sampleSize: 0,
      observedOutcome: 'Entity category not found',
      evidenceCategory: 'Unknown',
      geographicScope: city || 'GLOBAL',
      metricName: 'none',
      metricValue: 0,
      evidenceType: 'INFERRED',
      reason: 'No category mapping available for this entity.',
    };
  }

  /**
   * Detailed category feedback across all 3 domains
   */
  public async getCategoryDeepDive(categoryName: string, city?: string): Promise<{
    categoryName: string;
    city: string;
    jobOutcome: JobOutcomeFeedback | null;
    serviceOutcome: ServiceOutcomeFeedback | null;
    retailOutcome: RetailOutcomeFeedback | null;
    blendedBoost: number;
    overallConfidence: FeedbackConfidence;
    summary: string;
  }> {
    const cleanCat = categoryName.trim().toLowerCase();
    const [jobs, services, retail] = await Promise.all([
      this.getJobCategoryFeedback(city),
      this.getServiceCategoryFeedback(city),
      this.getRetailCategoryFeedback(city),
    ]);

    const jobMatch = jobs.find((j) => j.categoryName.toLowerCase() === cleanCat) || null;
    const serviceMatch = services.find((s) => s.categoryName.toLowerCase() === cleanCat) || null;
    const retailMatch = retail.find((r) => r.categoryName.toLowerCase() === cleanCat) || null;

    const validBoosts: number[] = [];
    if (jobMatch && jobMatch.confidence !== 'INSUFFICIENT_EVIDENCE') validBoosts.push(jobMatch.boost);
    if (serviceMatch && serviceMatch.confidence !== 'INSUFFICIENT_EVIDENCE') validBoosts.push(serviceMatch.boost);
    if (retailMatch && retailMatch.confidence !== 'INSUFFICIENT_EVIDENCE') validBoosts.push(retailMatch.boost);

    const blendedBoost = validBoosts.length > 0
      ? clampBoost(validBoosts.reduce((a, b) => a + b, 0) / validBoosts.length)
      : 0;

    let totalSamples = (jobMatch?.applicationCount || 0) + (serviceMatch?.bookingCount || 0) + (retailMatch?.orderCount || 0);
    const overallConfidence = evaluateConfidence(totalSamples);

    let summary = `Observed transactional feedback for ${categoryName}`;
    if (city) summary += ` in ${city}`;
    summary += `: Total recorded transactions: ${totalSamples}. Confidence: ${overallConfidence}. Blended outcome boost: ${blendedBoost > 0 ? `+${blendedBoost}` : blendedBoost}.`;

    return {
      categoryName,
      city: city || 'GLOBAL',
      jobOutcome: jobMatch,
      serviceOutcome: serviceMatch,
      retailOutcome: retailMatch,
      blendedBoost,
      overallConfidence,
      summary,
    };
  }
}

export const feedbackService = new FeedbackService();
