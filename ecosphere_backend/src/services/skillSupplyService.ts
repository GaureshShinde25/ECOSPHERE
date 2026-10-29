import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { skillTaxonomyService, CanonicalSkill } from './skillTaxonomyService.js';
import { skillDemandService, SkillDemandItem } from './skillDemandService.js';
import { logger } from '../utils/logger.js';

export interface SkillSupplyItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  observedProviderCount: number;
  observedBusinessCount: number;
  observedApplicantCount: number;
  inferredTalentPoolCount: number;
  totalEstimatedSupply: number;
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

export interface SkillGapFilterOptions {
  city?: string;
  category?: string;
  minRatio?: number;
  status?: 'DEFICIT' | 'BALANCED' | 'SURPLUS';
  limit?: number;
}

export const skillSupplyService = {
  /**
   * Evaluates local skill supply across verified providers, applicants, and inferred talent pool
   */
  async getSkillSupply(city: string = 'Kolkata'): Promise<{
    supply: SkillSupplyItem[];
    city: string;
  }> {
    try {
      // 1. Parallel queries for UserProfiles (inferred supply), JobApplications (observed applicants), and Services
      const [profilesRes, applicantsRes, servicesRes] = await Promise.all([
        databaseService.query<any>(
          `SELECT Occupation, COUNT(*) AS OccCount
           FROM UserProfiles WITH (NOLOCK)
           WHERE Occupation IS NOT NULL
           GROUP BY Occupation`
        ),
        databaseService.query<any>(
          `SELECT 
             ja.JobId, j.JobTitle, COUNT(DISTINCT ja.ApplicantUserId) AS ApplicantCount
           FROM JobApplications ja WITH (NOLOCK)
           JOIN Jobs j WITH (NOLOCK) ON ja.JobId = j.JobId
           JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
           WHERE b.City = @city OR @city IS NULL OR @city = ''
           GROUP BY ja.JobId, j.JobTitle`,
          [{ name: 'city', type: mssql.NVarChar(150), value: city }]
        ),
        databaseService.query<any>(
          `SELECT 
             s.ServiceId, s.ServiceName, s.BusinessId
           FROM Services s WITH (NOLOCK)
           JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
           WHERE s.IsActive = 1 AND s.IsAvailable = 1
             AND (b.City = @city OR @city IS NULL OR @city = '')`,
          [{ name: 'city', type: mssql.NVarChar(150), value: city }]
        ),
      ]);

      const canonicalSkills = skillTaxonomyService.getAllSkills();
      const supplyMap = new Map<number, {
        skill: CanonicalSkill;
        providers: number;
        businesses: Set<number>;
        applicants: number;
        inferredPool: number;
      }>();

      for (const s of canonicalSkills) {
        supplyMap.set(s.skillId, {
          skill: s,
          providers: 0,
          businesses: new Set<number>(),
          applicants: 0,
          inferredPool: 0,
        });
      }

      // 2. Map Inferred Talent Pool from UserProfiles.Occupation
      for (const row of profilesRes.recordset || []) {
        const occ = String(row.Occupation);
        const count = Number(row.OccCount) || 1;
        const mappedSkills = skillTaxonomyService.mapOccupationToSkills(occ);

        for (const ms of mappedSkills) {
          const entry = supplyMap.get(ms.skillId);
          if (entry) {
            entry.inferredPool += count;
          }
        }
      }

      // 3. Map Observed Applicants from JobApplications
      for (const row of applicantsRes.recordset || []) {
        const title = String(row.JobTitle);
        const appCount = Number(row.ApplicantCount) || 0;
        const mappedSkills = skillTaxonomyService.mapJobTitleToSkills(title);

        for (const ms of mappedSkills) {
          const entry = supplyMap.get(ms.skillId);
          if (entry) {
            entry.applicants += appCount;
          }
        }
      }

      // 4. Map Observed Providers from Services
      for (const row of servicesRes.recordset || []) {
        const sName = String(row.ServiceName);
        const bId = Number(row.BusinessId);
        const mappedSkills = skillTaxonomyService.mapServiceToSkills(sName);

        for (const ms of mappedSkills) {
          const entry = supplyMap.get(ms.skillId);
          if (entry) {
            entry.providers += 1;
            if (bId) entry.businesses.add(bId);
          }
        }
      }

      // 5. Build Supply Items
      const supplyItems: SkillSupplyItem[] = [];

      for (const [skillId, entry] of supplyMap.entries()) {
        const totalEstimatedSupply = entry.providers + entry.applicants + Math.round(entry.inferredPool * 0.1);

        supplyItems.push({
          skillId,
          skillName: entry.skill.skillName,
          category: entry.skill.category,
          city,
          observedProviderCount: entry.providers,
          observedBusinessCount: entry.businesses.size,
          observedApplicantCount: entry.applicants,
          inferredTalentPoolCount: entry.inferredPool,
          totalEstimatedSupply,
          evidence: [
            {
              type: 'OBSERVED',
              label: 'Verified Active Providers',
              value: entry.providers,
            },
            {
              type: 'OBSERVED',
              label: 'Active Job Applicants',
              value: entry.applicants,
            },
            {
              type: 'INFERRED',
              label: 'Local Occupation Talent Pool (Proxy)',
              value: entry.inferredPool,
            },
            {
              type: 'CALCULATED',
              label: 'Total Estimated Supply',
              value: totalEstimatedSupply,
            },
          ],
        });
      }

      return { supply: supplyItems, city };
    } catch (err) {
      logger.error('Failed to calculate skill supply', { error: (err as Error).message });
      throw err;
    }
  },

  /**
   * Deterministically calculates Skill Supply Gaps (Demand/Supply ratio)
   */
  async getSkillSupplyGaps(options: SkillGapFilterOptions = {}): Promise<{
    gaps: SkillSupplyGapItem[];
    total: number;
    city: string;
  }> {
    const city = options.city || 'Kolkata';
    const limit = Math.min(50, Math.max(1, options.limit || 20));

    try {
      const [demandRes, supplyRes] = await Promise.all([
        skillDemandService.getSkillDemand({ city, limit: 50 }),
        this.getSkillSupply(city),
      ]);

      const supplyMap = new Map<number, SkillSupplyItem>();
      for (const s of supplyRes.supply) {
        supplyMap.set(s.skillId, s);
      }

      const gaps: SkillSupplyGapItem[] = [];

      for (const dem of demandRes.skills) {
        if (options.category && dem.category.toLowerCase() !== options.category.toLowerCase()) {
          continue;
        }

        const sup = supplyMap.get(dem.skillId);
        const supplyCount = sup ? sup.totalEstimatedSupply : 0;
        const isZeroSupply = supplyCount === 0;

        // Safe ratio calculation: Demand / max(1, Supply)
        const rawRatio = dem.demandCount / Math.max(1, supplyCount);
        const demandSupplyRatio = Number(rawRatio.toFixed(2));

        // Deterministic market status
        let marketStatus: 'DEFICIT' | 'BALANCED' | 'SURPLUS' = 'BALANCED';
        if (demandSupplyRatio >= 2.0 && dem.demandCount >= 5) {
          marketStatus = 'DEFICIT';
        } else if (demandSupplyRatio < 0.7 && supplyCount >= 8) {
          marketStatus = 'SURPLUS';
        }

        if (options.status && marketStatus !== options.status) {
          continue;
        }

        if (options.minRatio && demandSupplyRatio < options.minRatio) {
          continue;
        }

        // Empirical confidence score
        const totalSample = dem.demandCount + supplyCount;
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        const limitations: Array<{ code: string; description: string; severity: 'INFO' | 'WARNING' }> = [];

        if (totalSample >= 15) {
          confidence = 'HIGH';
        } else if (totalSample < 6) {
          confidence = 'LOW';
          limitations.push({
            code: 'SMALL_SAMPLE',
            description: 'Low local transaction volume observed for this skill in target city.',
            severity: 'WARNING',
          });
        }

        if (isZeroSupply) {
          limitations.push({
            code: 'ZERO_LOCAL_SUPPLY',
            description: 'No verified active providers or applicants found; ratio calculated with safe unit floor.',
            severity: 'INFO',
          });
        }

        gaps.push({
          skillId: dem.skillId,
          skillName: dem.skillName,
          category: dem.category,
          city,
          demandCount: dem.demandCount,
          supplyCount,
          demandSupplyRatio,
          marketStatus,
          confidence,
          isZeroSupply,
          limitations,
          evidence: [
            {
              type: 'OBSERVED',
              label: 'Local Skill Demand',
              value: dem.demandCount,
            },
            {
              type: 'OBSERVED',
              label: 'Local Skill Supply',
              value: supplyCount,
            },
            {
              type: 'CALCULATED',
              label: 'Demand-to-Supply Gap Ratio',
              value: `${demandSupplyRatio}x`,
            },
            {
              type: 'CALCULATED',
              label: 'Market Balance Status',
              value: marketStatus,
            },
          ],
        });
      }

      // Sort by gap ratio descending (highest deficit first)
      gaps.sort((a, b) => b.demandSupplyRatio - a.demandSupplyRatio);

      return {
        gaps: gaps.slice(0, limit),
        total: gaps.length,
        city,
      };
    } catch (err) {
      logger.error('Failed to calculate skill supply gaps', { error: (err as Error).message });
      throw err;
    }
  },
};
