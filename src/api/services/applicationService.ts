import { BaseRepository } from '@/api/repositories/baseRepository';
import { Application } from '@/types/entities';
import { RepositoryOptions } from '@/types/api';

export class ApplicationService extends BaseRepository<Application> {
  protected endpoint = '/applications';

  async getApplicationsByJob(
    jobId: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, job_id: jobId }
    });
  }

  async getApplicationsByCandidate(
    candidateId: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, candidate_id: candidateId }
    });
  }

  async getApplicationsByStatus(
    status: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, status }
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    status: string
  ): Promise<Application> {
    return this.patch(applicationId, { status });
  }

  async scoreApplication(
    applicationId: string
  ): Promise<any> {
    return this.patch(applicationId, {});
  }

  async addApplicationNote(
    applicationId: string,
    note: string
  ): Promise<Application> {
    return this.patch(applicationId, { notes: note });
  }

  async assignToRecruiter(
    applicationId: string,
    recruiterId: string
  ): Promise<Application> {
    return this.patch(applicationId, { assigned_to: recruiterId });
  }
}

export const applicationService = new ApplicationService();