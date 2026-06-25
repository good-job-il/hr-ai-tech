import { BaseRepository } from '@/api/repositories/baseRepository';
import { Job } from '@/types/entities';
import { RepositoryOptions } from '@/types/api';

export class JobService extends BaseRepository<Job> {
  protected endpoint = '/jobs';

  async searchJobs(
    query: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, search: query }
    });
  }

  async getJobsByCompany(
    companyId: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, company_id: companyId }
    });
  }

  async getJobsByDomain(
    domainId: number,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, domain_id: domainId }
    });
  }

  async getRecommendedJobs(
    candidateId: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, recommended_for: candidateId }
    });
  }

  async closeJob(jobId: string): Promise<Job> {
    return this.patch(jobId, { is_closed: true });
  }

  async repostJob(jobId: string): Promise<Job> {
    return this.patch(jobId, { is_closed: false });
  }

  async increaseViews(jobId: string): Promise<void> {
    await this.patch(jobId, { views: (await this.getById(jobId)).views + 1 });
  }
}

export const jobService = new JobService();