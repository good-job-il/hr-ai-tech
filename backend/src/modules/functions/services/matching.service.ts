import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../../jobs/entities/job.entity';
import { SavedJobEntity } from '../../jobs/entities/saved-job.entity';
import { ApplicationEntity } from '../../applications/entities/application.entity';
import { CandidateProfileEntity } from '../../candidates/entities/candidate-profile.entity';
import { RoleTaxonomyEntity } from '../../taxonomy/entities/role-taxonomy.entity';
import { RoleAliasEntity } from '../../permissions/permissions.entities';
import { DomainEntity } from '../../taxonomy/entities/domain.entity';
import { UserEntity } from '../../users/user.entity';
import { ApplicationsService } from '../../applications/applications.service';
import {
  GetJobRecommendationsDto,
  SmartSearchDto,
} from '../dto/functions.dto';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(SavedJobEntity) private readonly savedJobRepo: Repository<SavedJobEntity>,
    @InjectRepository(ApplicationEntity) private readonly appRepo: Repository<ApplicationEntity>,
    @InjectRepository(CandidateProfileEntity) private readonly profileRepo: Repository<CandidateProfileEntity>,
    @InjectRepository(RoleTaxonomyEntity) private readonly roleRepo: Repository<RoleTaxonomyEntity>,
    @InjectRepository(RoleAliasEntity) private readonly aliasRepo: Repository<RoleAliasEntity>,
    @InjectRepository(DomainEntity) private readonly domainRepo: Repository<DomainEntity>,
    private readonly applicationsService: ApplicationsService,
  ) {}

  // ─── getJobRecommendations — similar jobs to a given job ────────────────
  async getJobRecommendations(dto: GetJobRecommendationsDto) {
    const job = await this.jobRepo.findOne({ where: { id: dto.job_id } });
    if (!job) throw new NotFoundException('Job not found');

    const allJobs = await this.jobRepo.find({
      where: { is_closed: false, is_deleted: false },
      order: { views: 'DESC' },
      take: 500,
    });

    const scored = allJobs
      .filter((j) => j.id !== dto.job_id)
      .map((j) => ({ ...j, score: this.calculateJobSimilarity(job, j) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, dto.limit);

    return { recommendations: scored };
  }

  private calculateJobSimilarity(job1: JobEntity, job2: JobEntity): number {
    let score = 0;
    if (job1.domain_id && job1.domain_id === job2.domain_id) score += 50;
    if (job1.role_id && job1.role_id === job2.role_id) score += 40;
    if (job1.specialization_id && job1.specialization_id === job2.specialization_id) score += 20;
    if (job1.location && job1.location === job2.location) score += 15;
    if (job1.category && job1.category === job2.category) score += 10;

    const words1 = (job1.title || '').toLowerCase().split(/\s+/);
    const words2 = (job2.title || '').toLowerCase().split(/\s+/);
    const commonWords = words1.filter((w) => words2.includes(w)).length;
    score += commonWords * 5;

    score += (job2.views || 0) * 0.1;

    const hoursSinceCreation = (Date.now() - new Date(job2.created_date).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 168) score += 5;

    return score;
  }

  // ─── getRecommendedJobs — jobs recommended to the current candidate ─────
  async getRecommendedJobs(user: UserEntity) {
    const profiles = await this.profileRepo.find({ where: { user_id: user.id } });
    if (!profiles.length) return { jobs: [] };
    const profile = profiles[0];

    const allJobs = await this.jobRepo.find({ where: { is_closed: false, is_deleted: false } });
    const savedJobIds = (await this.savedJobRepo.find({ where: { user_id: user.id } })).map((s) => s.job_id);
    const appliedJobIds = (await this.appRepo.find({ where: { candidate_user_id: user.id } })).map((a) => a.job_id);

    const relevantJobs = allJobs
      .filter((j) => !savedJobIds.includes(j.id) && !appliedJobIds.includes(j.id))
      .slice(0, 10);

    const scoredJobs = relevantJobs.map((job) => ({
      ...job,
      match_score: this.heuristicCandidateJobScore(profile, job),
    }));

    return {
      jobs: scoredJobs.sort((a, b) => b.match_score - a.match_score).slice(0, 5),
    };
  }

  /** Heuristic skill/experience overlap score (0-100) — deterministic, no external LLM required */
  private heuristicCandidateJobScore(profile: CandidateProfileEntity, job: JobEntity): number {
    let score = 0;
    const candidateSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const jobSkills = [...(job.required_skills || []), ...(job.preferred_skills || [])].map((s) => s.toLowerCase());

    const overlap = candidateSkills.filter((s) => jobSkills.includes(s)).length;
    score += Math.min(overlap * 15, 60);

    if (profile.experience_years && job.years_experience_required) {
      const diff = Math.abs(profile.experience_years - job.years_experience_required);
      score += Math.max(0, 20 - diff * 4);
    } else {
      score += 10;
    }

    if (profile.location && job.location && profile.location === job.location) score += 10;
    if (profile.job_type && job.type && profile.job_type === job.type) score += 10;

    return Math.min(100, Math.round(score));
  }

  // ─── scoreApplication — heuristic candidate/job match score ─────────────
  async scoreApplication(applicationId: number, user: UserEntity) {
    const app = await this.applicationsService.findById(applicationId, user);

    const job = app.job_id ? await this.jobRepo.findOne({ where: { id: app.job_id } }) : null;
    const profiles = await this.profileRepo.find({ where: { user_email: app.candidate_email } });
    const profile = profiles[0];

    let score: number;
    let reason: string;

    if (job && profile) {
      score = this.heuristicCandidateJobScore(profile, job);
      const candidateSkills = (profile.skills || []).map((s) => s.toLowerCase());
      const jobSkills = [...(job.required_skills || []), ...(job.preferred_skills || [])].map((s) => s.toLowerCase());
      const matched = candidateSkills.filter((s) => jobSkills.includes(s));
      reason = matched.length
        ? `התאמה על בסיס כישורים משותפים: ${matched.slice(0, 5).join(', ')}`
        : 'התאמה חלקית על בסיס ניסיון ומיקום';
    } else {
      score = 50;
      reason = 'לא נמצא מספיק מידע לחישוב התאמה מדויק — ציון ברירת מחדל';
    }

    await this.applicationsService.update(app.id, { match_score: score, match_reason: reason } as any, user);

    return { score, reason };
  }

  // ─── smartSearch ─────────────────────────────────────────────────────────
  async smartSearch(dto: SmartSearchDto) {
    const { query, filters, type, limit } = dto;
    const queryLower = (query || '').toLowerCase().trim();

    if (type === 'autocomplete') {
      const jobs = await this.jobRepo.find({ where: { is_closed: false, is_deleted: false }, order: { created_date: 'DESC' }, take: 100 });
      const roles = await this.roleRepo.find({ take: 500 });
      const aliases = await this.aliasRepo.find({ take: 500 });

      const suggestions = new Set<string>();
      jobs.forEach((job) => {
        if (job.title?.toLowerCase().startsWith(queryLower)) suggestions.add(job.title);
        if (job.company?.toLowerCase().startsWith(queryLower)) suggestions.add(job.company);
        if (job.category?.toLowerCase().includes(queryLower)) suggestions.add(job.category);
      });
      roles.forEach((role) => {
        if (role.name?.toLowerCase().startsWith(queryLower)) suggestions.add(role.name);
      });
      aliases.forEach((alias) => {
        if (alias.alias?.toLowerCase().startsWith(queryLower)) suggestions.add(alias.alias);
      });

      return { suggestions: Array.from(suggestions).slice(0, 8), query };
    }

    if (type === 'recommendations') {
      const jobs = await this.jobRepo.find({ order: { views: 'DESC' }, take: 100 });
      const categories = new Map<string, number>();
      jobs.forEach((job) => {
        if (job.category) categories.set(job.category, (categories.get(job.category) || 0) + 1);
      });
      const recommendations = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name);
      return { recommendations };
    }

    // ─── Main search with relevance scoring ────────────────────────────────
    let allJobs = await this.jobRepo.find({ where: { is_closed: false, is_deleted: false }, order: { created_date: 'DESC' }, take: 500 });

    const roles = await this.roleRepo.find({ take: 500 });
    const aliases = await this.aliasRepo.find({ take: 500 });
    const domains = await this.domainRepo.find({ take: 500 });

    let resolvedRoleId: number | null = null;
    if (queryLower) {
      const matchingAlias = aliases.find((a) => a.alias.toLowerCase() === queryLower);
      if (matchingAlias) {
        const canonicalRole = roles.find((r) => r.name === matchingAlias.canonical_role);
        if (canonicalRole) resolvedRoleId = canonicalRole.role_id;
      }
      if (!resolvedRoleId) {
        const matchingRole = roles.find((r) => r.name.toLowerCase() === queryLower);
        if (matchingRole) resolvedRoleId = matchingRole.role_id;
      }
    }

    const jobsWithScore = allJobs.map((job) => {
      let score = 0;
      if (!queryLower) {
        score = (job.views || 0) + 10;
      } else {
        if (job.title?.toLowerCase() === queryLower) score += 1000;
        else if (job.title?.toLowerCase().startsWith(queryLower)) score += 500;
        else if (resolvedRoleId && job.role_id === resolvedRoleId) score += 400;
        else if (job.role_id) {
          const role = roles.find((r) => r.role_id === job.role_id);
          if (role && role.name.toLowerCase().includes(queryLower)) score += 200;
        } else if (job.domain_id) {
          const domain = domains.find((d) => d.domain_id === job.domain_id);
          if (domain && domain.name.toLowerCase().includes(queryLower)) score += 150;
        } else if (job.title?.toLowerCase().includes(queryLower)) score += 100;
        else if (job.company?.toLowerCase().includes(queryLower)) score += 75;
        else if (job.category?.toLowerCase().includes(queryLower)) score += 50;

        const daysOld = (Date.now() - new Date(job.created_date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 20;
        else if (daysOld < 30) score += 10;

        score += (job.views || 0) * 0.05;
        score += (job.applications_count || 0) * 0.1;
      }
      return { job, relevanceScore: score };
    });

    let filtered = jobsWithScore;
    if (filters.type?.length) filtered = filtered.filter((x) => filters.type!.includes(x.job.type));
    if (filters.location) {
      filtered = filtered.filter((x) => x.job.location?.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.category?.length) filtered = filtered.filter((x) => filters.category!.includes(x.job.category ?? ''));
    if (filters.salary_min || filters.salary_max) {
      const min = filters.salary_min || 0;
      const max = filters.salary_max || Infinity;
      filtered = filtered.filter((x) => {
        const jobMin = x.job.salary_min || 0;
        const jobMax = x.job.salary_max || Infinity;
        return jobMax >= min && jobMin <= max;
      });
    }

    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      jobs: filtered.slice(0, limit).map((x) => x.job),
      total: filtered.length,
      query,
    };
  }
}
