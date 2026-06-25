import { BaseRepository } from '@/api/repositories/baseRepository';
import { Candidate } from '@/types/entities';
import { RepositoryOptions } from '@/types/api';

export class CandidateService extends BaseRepository<Candidate> {
  protected endpoint = '/candidates';

  async searchCandidates(
    query: string,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, search: query }
    });
  }

  async getCandidatesByDomain(
    domainId: number,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, domain_id: domainId }
    });
  }

  async getCandidatesByRole(
    roleId: number,
    options?: RepositoryOptions
  ): Promise<any> {
    return this.list({
      ...options,
      filters: { ...options?.filters, role_id: roleId }
    });
  }

  async uploadResume(
    candidateId: string,
    file: File
  ): Promise<Candidate> {
    const formData = new FormData();
    formData.append('resume', file);

    return this.patch(candidateId, { resume_filename: file.name });
  }

  async updateStatus(
    candidateId: string,
    status: string
  ): Promise<Candidate> {
    return this.patch(candidateId, { status });
  }

  async detectDuplicates(
    candidateId: string
  ): Promise<any> {
    return this.httpClient.get(`${this.endpoint}/${candidateId}/duplicates`);
  }

  private get httpClient() {
    const { httpClient } = require('@/api/client/httpClient');
    return httpClient;
  }
}

export const candidateService = new CandidateService();