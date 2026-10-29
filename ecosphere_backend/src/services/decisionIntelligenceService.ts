import { opportunityEngineService, OpportunityItem } from './opportunityEngineService.js';
import { economicIntelligenceService, EconomicInsightItem } from './economicIntelligenceService.js';
import { recommendationEngineService } from './recommendationEngineService.js';
import { jobService } from './jobService.js';
import { serviceService } from './serviceService.js';
import { businessService } from './businessService.js';
import { logger } from '../utils/logger.js';

export type MetricClassification = 'OBSERVED' | 'CALCULATED' | 'INFERRED';

export interface DecisionEvidenceItem {
  metric: string;
  value: string | number;
  classification: MetricClassification;
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DecisionLimitationItem {
  code: 'SMALL_SAMPLE' | 'STALE_DATA' | 'HIGH_SUPPLY_DENSITY' | 'GEOGRAPHIC_LIMITATION' | 'UNVERIFIED_MARGIN';
  description: string;
  severity: 'WARNING' | 'INFO';
}

export interface EvaluatedOpportunityDecision {
  opportunity: OpportunityItem;
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
    winner: string | 'DRAW';
  }>;
  winner: string | 'INSUFFICIENT_EVIDENCE';
  reason: string;
  evidence: DecisionEvidenceItem[];
  limitations: DecisionLimitationItem[];
}

export interface EmploymentIntelligenceResult {
  observedHiringVacancies: number;
  observedActiveProviders: number;
  inferredServiceGaps: Array<{ category: string; demandSupplyRatio: number; confidence: string }>;
  employmentSignals: Array<{ type: string; category: string; description: string; classification: MetricClassification }>;
  evidence: DecisionEvidenceItem[];
}

export const decisionIntelligenceService = {
  /**
   * Deterministically evaluates and ranks opportunities using Decision Score calculations
   */
  async getRankedDecisionOpportunities(options: { userIdStr?: string; limit?: number } = {}): Promise<{
    decisions: EvaluatedOpportunityDecision[];
    userContext: { city: string; role: string };
  }> {
    const limit = options.limit || 5;
    const oppRes = await opportunityEngineService.getOpportunities({ userIdStr: options.userIdStr, limit: limit * 2 });
    const userCity = oppRes.userContext.city;
    const userRole = (oppRes.userContext as any).role || 'customer';

    const evaluatedList: EvaluatedOpportunityDecision[] = [];

    for (const opp of oppRes.opportunities) {
      const oppConf: 'HIGH' | 'MEDIUM' | 'LOW' = opp.score >= 80 ? 'HIGH' : opp.score >= 60 ? 'MEDIUM' : 'LOW';

      // 1. Evidence Extraction
      const evidence: DecisionEvidenceItem[] = [
        { metric: 'Opportunity Score', value: `${opp.score}/100`, classification: 'CALCULATED', source: 'OpportunityEngine', confidence: oppConf },
        { metric: 'Relevance Fit', value: `${opp.relevance}%`, classification: 'CALCULATED', source: 'RecommendationEngine', confidence: oppConf },
        { metric: 'Target Node City', value: opp.location?.city || userCity, classification: 'OBSERVED', source: 'PlatformEntity', confidence: 'HIGH' },
      ];

      // 2. Limitations Extraction
      const limitations: DecisionLimitationItem[] = [];
      if (opp.score < 75) {
        limitations.push({
          code: 'SMALL_SAMPLE',
          description: 'Market activity sample size is moderate on platform.',
          severity: 'INFO',
        });
      }
      if (!opp.location?.city || opp.location.city !== userCity) {
        limitations.push({
          code: 'GEOGRAPHIC_LIMITATION',
          description: 'Opportunity resides in adjacent economic node.',
          severity: 'WARNING',
        });
      }
      limitations.push({
        code: 'UNVERIFIED_MARGIN',
        description: 'ECOSPHERE provides verified activity volume; private profit margins are unverified.',
        severity: 'INFO',
      });

      // 3. Deterministic Decision Score Formula
      // DecisionScore = 0.50 * OppScore + 0.35 * Relevance + 0.15 * LocationMatch
      const locationBonus = opp.location?.city === userCity ? 100 : 60;
      const decisionScore = Math.min(100, Math.round(0.5 * opp.score + 0.35 * opp.relevance + 0.15 * locationBonus));

      const rankReason = `Ranked #1 due to strong local demand velocity (Score ${opp.score}/100) and high ${userRole} profile match.`;

      evaluatedList.push({
        opportunity: opp,
        decisionScore,
        opportunityScore: opp.score,
        confidence: oppConf,
        evidence,
        limitations,
        rankReason,
      });
    }

    // Sort deterministically by Decision Score descending
    evaluatedList.sort((a, b) => b.decisionScore - a.decisionScore);

    return {
      decisions: evaluatedList.slice(0, limit),
      userContext: { city: userCity, role: userRole },
    };
  },

  /**
   * Compares two local economic categories side-by-side using deterministic metrics
   */
  async compareOpportunities(categoryA: string, categoryB: string, city: string = 'Kolkata'): Promise<OpportunityComparisonResult> {
    const insightData = await economicIntelligenceService.getEconomicInsights({ city, limit: 10 });

    const cleanA = (categoryA || 'Cleaning Services').trim().toLowerCase();
    const cleanB = (categoryB || 'Tutoring Services').trim().toLowerCase();

    const findMatch = (catName: string) =>
      insightData.insights.find((i) => i.category.toLowerCase().includes(catName) || catName.includes(i.category.toLowerCase())) ||
      insightData.insights[0];

    const matchA = findMatch(cleanA);

    // Ensure matchB is distinct if possible
    let matchB = insightData.insights.find((i) => i.id !== matchA.id && (i.category.toLowerCase().includes(cleanB) || cleanB.includes(i.category.toLowerCase())));
    if (!matchB) {
      matchB = insightData.insights.find((i) => i.id !== matchA.id) || matchA;
    }

    const demandA = matchA.evidence.demandCount || 0;
    const supplyA = matchA.evidence.supplyCount || 1;
    const ratioA = matchA.evidence.ratio || Number((demandA / Math.max(1, supplyA)).toFixed(2));

    const demandB = matchB.evidence.demandCount || 0;
    const supplyB = matchB.evidence.supplyCount || 1;
    const ratioB = matchB.evidence.ratio || Number((demandB / Math.max(1, supplyB)).toFixed(2));

    const dimensions = [
      { dimension: 'Recorded Demand (Bookings/Orders)', valueA: demandA, valueB: demandB, winner: demandA > demandB ? matchA.category : demandB > demandA ? matchB.category : 'DRAW' },
      { dimension: 'Active Providers (Supply)', valueA: supplyA, valueB: supplyB, winner: supplyA < supplyB ? matchA.category : supplyB < supplyA ? matchB.category : 'DRAW' },
      { dimension: 'Demand-to-Supply Ratio', valueA: ratioA, valueB: ratioB, winner: ratioA > ratioB ? matchA.category : ratioB > ratioA ? matchB.category : 'DRAW' },
    ];

    let winner = 'INSUFFICIENT_EVIDENCE';
    let reason = 'Insufficient comparative marketplace evidence to determine a clear winner.';

    if (Math.abs(ratioA - ratioB) < 0.2 && demandA === demandB) {
      winner = 'INSUFFICIENT_EVIDENCE';
      reason = 'Both categories demonstrate balanced platform demand; evidence is equal.';
    } else if (ratioA > ratioB) {
      winner = matchA.category;
      reason = `Based on live ECOSPHERE data, ${matchA.category} displays a stronger supply gap (${ratioA} ratio vs ${ratioB} ratio).`;
    } else if (ratioB > ratioA) {
      winner = matchB.category;
      reason = `Based on live ECOSPHERE data, ${matchB.category} displays a stronger supply gap (${ratioB} ratio vs ${ratioA} ratio).`;
    }

    const confA: 'HIGH' | 'MEDIUM' | 'LOW' = matchA.confidence === 'HIGH' || matchA.confidence === 'LOW' ? matchA.confidence : 'MEDIUM';
    const confB: 'HIGH' | 'MEDIUM' | 'LOW' = matchB.confidence === 'HIGH' || matchB.confidence === 'LOW' ? matchB.confidence : 'MEDIUM';

    const evidence: DecisionEvidenceItem[] = [
      { metric: `${matchA.category} Demand Ratio`, value: ratioA, classification: 'CALCULATED', source: 'EconomicIntelligence', confidence: confA },
      { metric: `${matchB.category} Demand Ratio`, value: ratioB, classification: 'CALCULATED', source: 'EconomicIntelligence', confidence: confB },
    ];

    const limitations: DecisionLimitationItem[] = [
      { code: 'SMALL_SAMPLE', description: 'Comparison is based on platform transaction activity in selected node.', severity: 'INFO' },
      { code: 'UNVERIFIED_MARGIN', description: 'Financial returns and individual business costs are not verified by platform.', severity: 'INFO' },
    ];

    return {
      categories: [matchA.category, matchB.category],
      dimensions,
      winner: winner as any,
      reason,
      evidence,
      limitations,
    };
  },

  /**
   * Evaluates evidence-based employment and job creation intelligence
   */
  async getEmploymentCreationIntelligence(city: string = 'Kolkata'): Promise<EmploymentIntelligenceResult> {
    const [jobsData, serviceData, insightData] = await Promise.all([
      jobService.getJobs({ limit: 10 }),
      serviceService.getServices({ limit: 10 }),
      economicIntelligenceService.getEconomicInsights({ city, limit: 5 }),
    ]);

    const totalVacancies = jobsData.jobs.reduce((acc, j) => acc + (j.vacancyCount || 1), 0);
    const activeProviders = serviceData.services.length;

    const gapInsights = insightData.insights.filter((i) => i.type === 'SUPPLY_GAP');
    const inferredGaps = gapInsights.map((g) => ({
      category: g.category,
      demandSupplyRatio: g.evidence.ratio || 2.0,
      confidence: g.confidence,
    }));

    const employmentSignals = [
      {
        type: 'OBSERVED_HIRING',
        category: 'Marketplace Hiring',
        description: `${totalVacancies} open job vacancies directly posted on ECOSPHERE node in ${city}.`,
        classification: 'OBSERVED' as MetricClassification,
      },
      {
        type: 'SERVICE_GIG_SUPPLY',
        category: 'Freelance & Service Providers',
        description: `${activeProviders} active service offerings available for booking.`,
        classification: 'OBSERVED' as MetricClassification,
      },
      {
        type: 'INFERRED_EMPLOYMENT_GAP',
        category: gapInsights[0]?.category || 'Home Services',
        description: `High demand-to-provider ratio (${gapInsights[0]?.evidence.ratio || 3.5}) indicates potential for new local service providers.`,
        classification: 'INFERRED' as MetricClassification,
      },
    ];

    const evidence: DecisionEvidenceItem[] = [
      { metric: 'Verified Job Vacancies', value: totalVacancies, classification: 'OBSERVED', source: 'JobService', confidence: 'HIGH' },
      { metric: 'Active Services', value: activeProviders, classification: 'OBSERVED', source: 'ServiceService', confidence: 'HIGH' },
    ];

    return {
      observedHiringVacancies: totalVacancies,
      observedActiveProviders: activeProviders,
      inferredServiceGaps: inferredGaps,
      employmentSignals,
      evidence,
    };
  },
};
