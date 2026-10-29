import { databaseService } from './databaseService.js';
import { logger } from '../utils/logger.js';

export interface CanonicalSkill {
  skillId: number;
  skillName: string;
  category: string;
  isActive: boolean;
}

export interface SkillMappingProvenance {
  skillId: number;
  skillName: string;
  sourceEntityType: 'JOB_TITLE' | 'JOB_CATEGORY' | 'SERVICE_NAME' | 'SERVICE_CATEGORY' | 'OCCUPATION';
  sourceValue: string;
  confidence: number;
}

// Master hardcoded registry of the 24 canonical database skills to enable instant zero-latency lookup
export const CANONICAL_SKILLS: CanonicalSkill[] = [
  { skillId: 1, skillName: 'Communication', category: 'Soft Skills', isActive: true },
  { skillId: 2, skillName: 'Leadership', category: 'Management', isActive: true },
  { skillId: 3, skillName: 'Marketing', category: 'Business', isActive: true },
  { skillId: 4, skillName: 'Sales', category: 'Business', isActive: true },
  { skillId: 5, skillName: 'Accounting', category: 'Finance', isActive: true },
  { skillId: 6, skillName: 'Customer Service', category: 'Business', isActive: true },
  { skillId: 7, skillName: 'Graphic Design', category: 'Creative', isActive: true },
  { skillId: 8, skillName: 'UI/UX Design', category: 'Creative', isActive: true },
  { skillId: 9, skillName: 'Photography', category: 'Creative', isActive: true },
  { skillId: 10, skillName: 'Video Editing', category: 'Creative', isActive: true },
  { skillId: 11, skillName: 'Web Development', category: 'Technology', isActive: true },
  { skillId: 12, skillName: 'Mobile Development', category: 'Technology', isActive: true },
  { skillId: 13, skillName: 'Software Development', category: 'Technology', isActive: true },
  { skillId: 14, skillName: 'Data Analysis', category: 'Technology', isActive: true },
  { skillId: 15, skillName: 'Digital Marketing', category: 'Technology', isActive: true },
  { skillId: 16, skillName: 'Teaching', category: 'Education', isActive: true },
  { skillId: 17, skillName: 'Driving', category: 'Services', isActive: true },
  { skillId: 18, skillName: 'Electrical Work', category: 'Services', isActive: true },
  { skillId: 19, skillName: 'Plumbing', category: 'Services', isActive: true },
  { skillId: 20, skillName: 'Carpentry', category: 'Services', isActive: true },
  { skillId: 21, skillName: 'Cooking', category: 'Hospitality', isActive: true },
  { skillId: 22, skillName: 'Hair Styling', category: 'Beauty', isActive: true },
  { skillId: 23, skillName: 'Tailoring', category: 'Fashion', isActive: true },
  { skillId: 24, skillName: 'Machine Operation', category: 'Manufacturing', isActive: true },
];

export class SkillTaxonomyService {
  private skillsCache: Map<number, CanonicalSkill> = new Map();
  private nameToSkillMap: Map<string, CanonicalSkill> = new Map();

  constructor() {
    this.initCache();
  }

  private initCache(): void {
    for (const skill of CANONICAL_SKILLS) {
      this.skillsCache.set(skill.skillId, skill);
      this.nameToSkillMap.set(skill.skillName.toLowerCase(), skill);
    }
  }

  /**
   * Syncs with SQL Server Skills table to ensure master consistency
   */
  async loadMasterSkills(): Promise<CanonicalSkill[]> {
    try {
      const res = await databaseService.query<any>(
        'SELECT SkillId, SkillName, Category, IsActive FROM Skills WITH (NOLOCK) WHERE IsActive = 1 ORDER BY SkillId'
      );
      if (res.recordset && res.recordset.length > 0) {
        this.skillsCache.clear();
        this.nameToSkillMap.clear();
        for (const row of res.recordset) {
          const item: CanonicalSkill = {
            skillId: Number(row.SkillId),
            skillName: row.SkillName,
            category: row.Category,
            isActive: Boolean(row.IsActive),
          };
          this.skillsCache.set(item.skillId, item);
          this.nameToSkillMap.set(item.skillName.toLowerCase(), item);
        }
      }
    } catch (err) {
      logger.warn('Failed to refresh Skills table from DB, using canonical fallback', { error: (err as Error).message });
    }
    return Array.from(this.skillsCache.values());
  }

  getAllSkills(): CanonicalSkill[] {
    return Array.from(this.skillsCache.values());
  }

  getSkillById(id: number): CanonicalSkill | undefined {
    return this.skillsCache.get(id);
  }

  getSkillByName(name: string): CanonicalSkill | undefined {
    return this.nameToSkillMap.get(name.trim().toLowerCase());
  }

  /**
   * Deterministically maps a Job Title to canonical skills.
   * Matches the 10 distinct job title archetypes in ECOSPHERE.
   */
  mapJobTitleToSkills(jobTitle: string): SkillMappingProvenance[] {
    if (!jobTitle) return [];
    const clean = jobTitle.toLowerCase();
    const results: SkillMappingProvenance[] = [];

    const addSkill = (id: number, conf: number = 0.95) => {
      const skill = this.getSkillById(id);
      if (skill && !results.some((r) => r.skillId === id)) {
        results.push({
          skillId: id,
          skillName: skill.skillName,
          sourceEntityType: 'JOB_TITLE',
          sourceValue: jobTitle,
          confidence: conf,
        });
      }
    };

    if (clean.includes('react native') || clean.includes('mobile developer')) {
      addSkill(12); // Mobile Development
      addSkill(13); // Software Development
    } else if (clean.includes('node.js') || clean.includes('full stack') || clean.includes('software engineer')) {
      addSkill(11); // Web Development
      addSkill(13); // Software Development
    } else if (clean.includes('cloud solutions architect') || clean.includes('architect')) {
      addSkill(13); // Software Development
      addSkill(2);  // Leadership
    } else if (clean.includes('quality assurance') || clean.includes('qa engineer')) {
      addSkill(13); // Software Development
      addSkill(14); // Data Analysis
    } else if (clean.includes('iot hardware') || clean.includes('hardware specialist')) {
      addSkill(18); // Electrical Work
      addSkill(24); // Machine Operation
    } else if (clean.includes('solar installation')) {
      addSkill(18); // Electrical Work
      addSkill(2);  // Leadership
    } else if (clean.includes('digital growth marketer') || clean.includes('marketer')) {
      addSkill(15); // Digital Marketing
      addSkill(3);  // Marketing
    } else if (clean.includes('customer experience') || clean.includes('support')) {
      addSkill(6); // Customer Service
      addSkill(1); // Communication
    } else if (clean.includes('retail store operations') || clean.includes('store operations')) {
      addSkill(2); // Leadership
      addSkill(4); // Sales
    } else if (clean.includes('operations & logistics') || clean.includes('logistics manager')) {
      addSkill(2);  // Leadership
      addSkill(17); // Driving / Logistics
    } else {
      // General fallback based on keywords
      if (clean.includes('sales')) addSkill(4);
      if (clean.includes('developer') || clean.includes('engineer')) addSkill(13);
      if (clean.includes('designer') || clean.includes('ui') || clean.includes('ux')) addSkill(8);
      if (clean.includes('accountant') || clean.includes('finance')) addSkill(5);
    }

    return results;
  }

  /**
   * Deterministically maps a Service Name to canonical skills.
   * Matches the 10 core service archetypes in ECOSPHERE.
   */
  mapServiceToSkills(serviceName: string): SkillMappingProvenance[] {
    if (!serviceName) return [];
    const clean = serviceName.toLowerCase();
    const results: SkillMappingProvenance[] = [];

    const addSkill = (id: number, conf: number = 0.95) => {
      const skill = this.getSkillById(id);
      if (skill && !results.some((r) => r.skillId === id)) {
        results.push({
          skillId: id,
          skillName: skill.skillName,
          sourceEntityType: 'SERVICE_NAME',
          sourceValue: serviceName,
          confidence: conf,
        });
      }
    };

    if (clean.includes('fiber installation') || clean.includes('high-speed fiber')) {
      addSkill(18); // Electrical Work
      addSkill(11); // Web Development / Networking
    } else if (clean.includes('electrical diagnostics') || clean.includes('smart home electrical')) {
      addSkill(18); // Electrical Work
    } else if (clean.includes('solar panel')) {
      addSkill(18); // Electrical Work
    } else if (clean.includes('ev charger')) {
      addSkill(18); // Electrical Work
    } else if (clean.includes('cctv security') || clean.includes('security setup')) {
      addSkill(18); // Electrical Work
    } else if (clean.includes('laptop & pc diagnostics') || clean.includes('pc diagnostics')) {
      addSkill(13); // Software Development
      addSkill(18); // Electrical Work
    } else if (clean.includes('plumbing') || clean.includes('leak repair')) {
      addSkill(19); // Plumbing
    } else if (clean.includes('organic deep cleaning') || clean.includes('cleaning')) {
      addSkill(17); // Services / Maintenance
    } else if (clean.includes('ac servicing') || clean.includes('overhaul')) {
      addSkill(18); // Electrical Work
      addSkill(24); // Machine Operation
    } else if (clean.includes('interior design') || clean.includes('consult')) {
      addSkill(8); // UI/UX / Design
      addSkill(1); // Communication
    }

    return results;
  }

  /**
   * Deterministically maps a UserProfiles.Occupation to canonical skills.
   */
  mapOccupationToSkills(occupation: string): SkillMappingProvenance[] {
    if (!occupation) return [];
    const clean = occupation.toLowerCase();
    const results: SkillMappingProvenance[] = [];

    const addSkill = (id: number, conf: number = 0.85) => {
      const skill = this.getSkillById(id);
      if (skill && !results.some((r) => r.skillId === id)) {
        results.push({
          skillId: id,
          skillName: skill.skillName,
          sourceEntityType: 'OCCUPATION',
          sourceValue: occupation,
          confidence: conf,
        });
      }
    };

    if (clean.includes('software engineer') || clean.includes('developer') || clean.includes('architect')) {
      addSkill(13); // Software Development
      addSkill(11); // Web Development
      addSkill(12); // Mobile Development
    } else if (clean.includes('technician')) {
      addSkill(18); // Electrical Work
      addSkill(24); // Machine Operation
    } else if (clean.includes('consultant')) {
      addSkill(1); // Communication
      addSkill(2); // Leadership
      addSkill(14); // Data Analysis
    } else if (clean.includes('business owner') || clean.includes('merchant')) {
      addSkill(2); // Leadership
      addSkill(4); // Sales
      addSkill(5); // Accounting
    } else if (clean.includes('freelancer')) {
      addSkill(7); // Graphic Design
      addSkill(11); // Web Development
      addSkill(15); // Digital Marketing
    } else if (clean.includes('student')) {
      addSkill(1); // Communication
      addSkill(16); // Teaching / Learning
    }

    return results;
  }

  /**
   * Deterministically maps JobCategories to primary canonical skills.
   */
  mapJobCategoryToSkills(categoryId: number, categoryName: string): SkillMappingProvenance[] {
    const results: SkillMappingProvenance[] = [];
    const addSkill = (id: number) => {
      const skill = this.getSkillById(id);
      if (skill && !results.some((r) => r.skillId === id)) {
        results.push({
          skillId: id,
          skillName: skill.skillName,
          sourceEntityType: 'JOB_CATEGORY',
          sourceValue: categoryName,
          confidence: 0.9,
        });
      }
    };

    switch (categoryId) {
      case 1: // Technology
        addSkill(13); addSkill(11); addSkill(12); break;
      case 2: // Sales & Marketing
        addSkill(4); addSkill(3); addSkill(15); break;
      case 3: // Finance & Accounting
        addSkill(5); break;
      case 4: // Healthcare
        addSkill(1); break;
      case 5: // Education
        addSkill(16); break;
      case 6: // Design & Creative
        addSkill(7); addSkill(8); addSkill(9); addSkill(10); break;
      case 7: // Operations
        addSkill(2); break;
      case 8: // Customer Support
        addSkill(6); addSkill(1); break;
      case 9: // Construction
        addSkill(18); addSkill(19); addSkill(20); break;
      case 10: // Hospitality
        addSkill(21); break;
      case 11: // Retail
        addSkill(4); addSkill(6); break;
      case 12: // Logistics
        addSkill(17); break;
      case 13: // Manufacturing
        addSkill(24); break;
      default:
        break;
    }

    return results;
  }
}

export const skillTaxonomyService = new SkillTaxonomyService();
