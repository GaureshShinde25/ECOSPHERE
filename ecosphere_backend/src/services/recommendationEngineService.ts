import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { opportunityEngineService, OpportunityItem, OpportunityType } from './opportunityEngineService.js';
import { feedbackService, OutcomeFeedbackResult } from './feedbackService.js';
import { logger } from '../utils/logger.js';

export interface PersonalizedRecommendationItem {
  opportunity: OpportunityItem;
  recommendationScore: number;
  matchQuality: 'Strong Match' | 'Good Match' | 'Local Match';
  reasons: string[];
  feedbackEvidence?: OutcomeFeedbackResult;
  feedbackBoost?: number;
}

export interface RecommendationFilterOptions {
  userIdStr: string;
  type?: OpportunityType;
  city?: string;
  limit?: number;
}

interface UserPersonalizationContext {
  dbUserId: number;
  role: string;
  city: string;
  appliedJobIds: Set<string>;
  bookedServiceIds: Set<string>;
  orderedBusinessIds: Set<string>;
  savedServiceIds: Set<string>;
  savedJobIds: Set<string>;
}

async function buildUserPersonalizationContext(userIdStr: string): Promise<UserPersonalizationContext> {
  let dbUserId = 0;
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

  dbUserId = userRow ? Number(userRow.UserId) : 0;
  const city = 'Kolkata';

  if (!dbUserId) {
    return {
      dbUserId: 0,
      role: 'customer',
      city,
      appliedJobIds: new Set(),
      bookedServiceIds: new Set(),
      orderedBusinessIds: new Set(),
      savedServiceIds: new Set(),
      savedJobIds: new Set(),
    };
  }

  // Parallelize user interaction signal extraction queries
  const [roleRes, appsRes, bkRes, ordRes, favSrvRes, favJobRes] = await Promise.all([
    databaseService.query<any>(
      `SELECT r.RoleName
       FROM UserRoles ur WITH (NOLOCK)
       INNER JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
       WHERE ur.UserId = @uId`,
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
    databaseService.query<any>(
      'SELECT JobId FROM JobApplications WITH (NOLOCK) WHERE ApplicantUserId = @uId',
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
    databaseService.query<any>(
      'SELECT ServiceId FROM Bookings WITH (NOLOCK) WHERE CustomerUserId = @uId',
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
    databaseService.query<any>(
      'SELECT BusinessId FROM Orders WITH (NOLOCK) WHERE CustomerUserId = @uId',
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
    databaseService.query<any>(
      'SELECT ServiceId FROM SavedServices WITH (NOLOCK) WHERE UserId = @uId',
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
    databaseService.query<any>(
      'SELECT JobId FROM SavedJobs WITH (NOLOCK) WHERE UserId = @uId',
      [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
    ),
  ]);

  const rawRole = roleRes.recordset?.[0]?.RoleName || 'customer';
  const role = String(rawRole).toLowerCase();

  const appliedJobIds = new Set((appsRes.recordset || []).map((r: any) => String(r.JobId)));
  const bookedServiceIds = new Set((bkRes.recordset || []).map((r: any) => String(r.ServiceId)));
  const orderedBusinessIds = new Set((ordRes.recordset || []).map((r: any) => String(r.BusinessId)));
  const savedServiceIds = new Set((favSrvRes.recordset || []).map((r: any) => String(r.ServiceId)));
  const savedJobIds = new Set((favJobRes.recordset || []).map((r: any) => String(r.JobId)));

  return {
    dbUserId,
    role,
    city,
    appliedJobIds,
    bookedServiceIds,
    orderedBusinessIds,
    savedServiceIds,
    savedJobIds,
  };
}

export const recommendationEngineService = {
  /**
   * Generates personalized, role-aware, data-backed recommendations for a specific user
   */
  async getPersonalizedRecommendations(options: RecommendationFilterOptions): Promise<{
    recommendations: PersonalizedRecommendationItem[];
    total: number;
    userContext: { role: string; city: string; activeSignalsCount: number };
  }> {
    try {
      const userCtx = await buildUserPersonalizationContext(options.userIdStr);
      const limit = Math.min(50, Math.max(1, options.limit || 10));

      // Fetch base candidate opportunities from Phase 29A Opportunity Engine
      const candidateData = await opportunityEngineService.getOpportunities({
        userIdStr: options.userIdStr,
        type: options.type,
        city: options.city || userCtx.city,
        limit: 30,
      });

      const recommendations: PersonalizedRecommendationItem[] = [];

      for (const opp of candidateData.opportunities) {
        let roleBoost = 0;
        let locationBoost = 0;
        let interactionBoost = 0;
        let deduplicationPenalty = 0;
        const reasons: string[] = [];

        // 1. Role-aware priority boosting
        if (userCtx.role === 'customer') {
          if (opp.type === 'SERVICE' || opp.type === 'DEMAND' || opp.type === 'COLLABORATION') {
            roleBoost = 10;
            reasons.push('Tailored for active customer discovery in your local network.');
          }
        } else if (userCtx.role === 'seller' || userCtx.role === 'administrator') {
          if (opp.type === 'DEMAND' || opp.type === 'COLLABORATION' || opp.type === 'JOB') {
            roleBoost = 15;
            reasons.push('Recommended for business expansion and local market demand.');
          }
        } else {
          // Worker / Job Seeker
          if (opp.type === 'JOB' || opp.type === 'GIG' || opp.type === 'SKILL') {
            roleBoost = 15;
            reasons.push('Matches active employment & income generation opportunities.');
          }
        }

        // 2. Location relevance boosting
        if (opp.location?.city && opp.location.city.toLowerCase().includes(userCtx.city.toLowerCase())) {
          locationBoost = 10;
          reasons.push(`Matches active economic activity in ${userCtx.city}.`);
        }

        // 3. User interaction history signal matching
        const sourceJob = opp.sourceEntities.find((e) => e.entityType === 'Job');
        const sourceService = opp.sourceEntities.find((e) => e.entityType === 'Service');
        const sourceBiz = opp.sourceEntities.find((e) => e.entityType === 'Business');

        if (sourceJob && userCtx.savedJobIds.has(sourceJob.entityId)) {
          interactionBoost += 15;
          reasons.push('Matches positions in your saved job list.');
        }

        if (sourceService && (userCtx.savedServiceIds.has(sourceService.entityId) || userCtx.bookedServiceIds.has(sourceService.entityId))) {
          interactionBoost += 15;
          reasons.push('Aligned with your saved services and booking history.');
        }

        if (sourceBiz && userCtx.orderedBusinessIds.has(sourceBiz.entityId)) {
          interactionBoost += 10;
          reasons.push('Offered by a business you previously ordered from.');
        }

        // 4. Non-repetition / Deduplication penalty
        if (sourceJob && userCtx.appliedJobIds.has(sourceJob.entityId)) {
          deduplicationPenalty = 35;
          reasons.push('You have already applied to this position.');
        }

        if (sourceService && userCtx.bookedServiceIds.has(sourceService.entityId)) {
          deduplicationPenalty = 15;
        }

        // 5. Transactional Outcome Feedback Boost (Phase 35)
        let outcomeFeedbackBoost = 0;
        let feedbackEvidence: OutcomeFeedbackResult | undefined;
        const targetCity = opp.location?.city || userCtx.city;

        if (sourceJob) {
          feedbackEvidence = await feedbackService.getOutcomeFeedbackForEntity('JOB', sourceJob.entityId, targetCity);
        } else if (sourceService) {
          feedbackEvidence = await feedbackService.getOutcomeFeedbackForEntity('SERVICE', sourceService.entityId, targetCity);
        } else if (sourceBiz) {
          feedbackEvidence = await feedbackService.getOutcomeFeedbackForEntity('BUSINESS', sourceBiz.entityId, targetCity);
        }

        if (feedbackEvidence && feedbackEvidence.confidence !== 'INSUFFICIENT_EVIDENCE') {
          // Strictly clamp within [-10, +10]
          outcomeFeedbackBoost = Math.max(-10, Math.min(10, feedbackEvidence.boost));
          if (outcomeFeedbackBoost !== 0) {
            reasons.push(feedbackEvidence.reason);
          }
        }

        // Include original opportunity explainability statement
        reasons.push(opp.reason);

        // Calculate final Personalized Recommendation Score:
        // Min(99, Max(50, OppScore + RoleBoost + LocationBoost + InteractionBoost + OutcomeFeedbackBoost - DeduplicationPenalty))
        const rawScore = opp.score + roleBoost + locationBoost + interactionBoost + outcomeFeedbackBoost - deduplicationPenalty;
        const finalScore = Math.min(99, Math.max(50, Math.round(rawScore)));

        // Determine human-readable Match Quality
        let matchQuality: 'Strong Match' | 'Good Match' | 'Local Match' = 'Local Match';
        if (finalScore >= 88) {
          matchQuality = 'Strong Match';
        } else if (finalScore >= 75) {
          matchQuality = 'Good Match';
        }

        recommendations.push({
          opportunity: opp,
          recommendationScore: finalScore,
          matchQuality,
          reasons,
          feedbackEvidence,
          feedbackBoost: outcomeFeedbackBoost,
        });
      }

      // Sort by Recommendation Score descending
      recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

      const paginated = recommendations.slice(0, limit);
      const activeSignalsCount =
        userCtx.appliedJobIds.size +
        userCtx.bookedServiceIds.size +
        userCtx.orderedBusinessIds.size +
        userCtx.savedServiceIds.size +
        userCtx.savedJobIds.size;

      return {
        recommendations: paginated,
        total: recommendations.length,
        userContext: {
          role: userCtx.role,
          city: userCtx.city,
          activeSignalsCount,
        },
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to generate personalized recommendations', { error: err.message, options });
      throw err;
    }
  },
};
