import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { skillTaxonomyService, CanonicalSkill } from './skillTaxonomyService.js';
import { logger } from '../utils/logger.js';

export interface SkillDemandItem {
  skillId: number;
  skillName: string;
  category: string;
  city: string;
  demandCount: number;
  vacancyCount: number;
  bookingDemand: number;
  activeProviderCount: number;
  businessCount: number;
  demandRank: number;
  evidence: Array<{
    type: 'OBSERVED' | 'CALCULATED' | 'INFERRED';
    label: string;
    value: any;
  }>;
}

export interface SkillDemandFilterOptions {
  city?: string;
  category?: string;
  limit?: number;
}

export const skillDemandService = {
  /**
   * Evaluates evidence-based skill demand across open jobs and service bookings
   */
  async getSkillDemand(options: SkillDemandFilterOptions = {}): Promise<{
    skills: SkillDemandItem[];
    total: number;
    city: string;
  }> {
    const city = options.city || 'Kolkata';
    const limit = Math.min(50, Math.max(1, options.limit || 20));

    try {
      // 1. Parallel SQL queries for Jobs, Services, and Bookings
      const [jobsRes, servicesRes, bookingsRes] = await Promise.all([
        databaseService.query<any>(
          `SELECT 
             j.JobId, j.JobTitle, j.VacancyCount, j.JobCategoryId, j.BusinessId,
             b.City, b.BusinessName
           FROM Jobs j WITH (NOLOCK)
           LEFT JOIN Businesses b WITH (NOLOCK) ON j.BusinessId = b.BusinessId
           WHERE j.IsActive = 1 AND j.Status = 'OPEN'
             AND (b.City = @city OR @city IS NULL OR @city = '')`,
          [{ name: 'city', type: mssql.NVarChar(150), value: city }]
        ),
        databaseService.query<any>(
          `SELECT 
             s.ServiceId, s.ServiceName, s.ServiceCategoryId, s.BusinessId,
             b.City, b.BusinessName
           FROM Services s WITH (NOLOCK)
           LEFT JOIN Businesses b WITH (NOLOCK) ON s.BusinessId = b.BusinessId
           WHERE s.IsActive = 1 AND s.IsAvailable = 1
             AND (b.City = @city OR @city IS NULL OR @city = '')`,
          [{ name: 'city', type: mssql.NVarChar(150), value: city }]
        ),
        databaseService.query<any>(
          `SELECT 
             bk.ServiceId, COUNT(*) AS BookingCount
           FROM Bookings bk WITH (NOLOCK)
           LEFT JOIN Businesses b WITH (NOLOCK) ON bk.BusinessId = b.BusinessId
           WHERE (b.City = @city OR @city IS NULL OR @city = '')
           GROUP BY bk.ServiceId`,
          [{ name: 'city', type: mssql.NVarChar(150), value: city }]
        ),
      ]);

      const jobs = jobsRes.recordset || [];
      const services = servicesRes.recordset || [];
      const bookingCountsMap = new Map<number, number>();
      for (const row of bookingsRes.recordset || []) {
        bookingCountsMap.set(Number(row.ServiceId), Number(row.BookingCount));
      }

      // 2. Initialize skill telemetry map for all 24 canonical skills
      const canonicalSkills = skillTaxonomyService.getAllSkills();
      const telemetryMap = new Map<number, {
        skill: CanonicalSkill;
        vacancyCount: number;
        bookingCount: number;
        providerCount: number;
        businesses: Set<number>;
      }>();

      for (const s of canonicalSkills) {
        telemetryMap.set(s.skillId, {
          skill: s,
          vacancyCount: 0,
          bookingCount: 0,
          providerCount: 0,
          businesses: new Set<number>(),
        });
      }

      // 3. Map Jobs to Skills
      for (const job of jobs) {
        const mappedSkills = skillTaxonomyService.mapJobTitleToSkills(job.JobTitle);
        const vacancies = Number(job.VacancyCount) || 1;
        const bId = Number(job.BusinessId);

        for (const ms of mappedSkills) {
          const entry = telemetryMap.get(ms.skillId);
          if (entry) {
            entry.vacancyCount += vacancies;
            if (bId) entry.businesses.add(bId);
          }
        }
      }

      // 4. Map Services & Bookings to Skills
      for (const srv of services) {
        const sId = Number(srv.ServiceId);
        const bId = Number(srv.BusinessId);
        const bCount = bookingCountsMap.get(sId) || 0;
        const mappedSkills = skillTaxonomyService.mapServiceToSkills(srv.ServiceName);

        for (const ms of mappedSkills) {
          const entry = telemetryMap.get(ms.skillId);
          if (entry) {
            entry.providerCount += 1;
            entry.bookingCount += bCount;
            if (bId) entry.businesses.add(bId);
          }
        }
      }

      // 5. Build Demand Items
      let demandItems: SkillDemandItem[] = [];

      for (const [skillId, t] of telemetryMap.entries()) {
        const totalDemand = t.vacancyCount * 2 + t.bookingCount; // Vacancies weighted for full employment demand

        if (options.category && t.skill.category.toLowerCase() !== options.category.toLowerCase()) {
          continue;
        }

        demandItems.push({
          skillId,
          skillName: t.skill.skillName,
          category: t.skill.category,
          city,
          demandCount: totalDemand,
          vacancyCount: t.vacancyCount,
          bookingDemand: t.bookingCount,
          activeProviderCount: t.providerCount,
          businessCount: t.businesses.size,
          demandRank: 1, // calculated after sorting
          evidence: [
            {
              type: 'OBSERVED',
              label: 'Verified Open Vacancies',
              value: t.vacancyCount,
            },
            {
              type: 'OBSERVED',
              label: 'Marketplace Service Bookings',
              value: t.bookingCount,
            },
            {
              type: 'OBSERVED',
              label: 'Active Service Offerings',
              value: t.providerCount,
            },
            {
              type: 'CALCULATED',
              label: 'Composite Demand Velocity',
              value: totalDemand,
            },
          ],
        });
      }

      // 6. Sort by Demand Count descending
      demandItems.sort((a, b) => b.demandCount - a.demandCount);
      demandItems.forEach((item, idx) => {
        item.demandRank = idx + 1;
      });

      return {
        skills: demandItems.slice(0, limit),
        total: demandItems.length,
        city,
      };
    } catch (err) {
      logger.error('Failed to calculate skill demand', { error: (err as Error).message });
      throw err;
    }
  },
};
