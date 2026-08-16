import { httpClient } from '@/api/client/httpClient';

export interface TaxonomyDomain { domain_id: number; name: string }
export interface TaxonomyRole { role_id: number; domain_id: number; domain_name: string | null; name: string }
export interface TaxonomySpecialization { specialization_id: number; role_name: string; name: string }
export interface WorkMode { mode_id: number; name: string }
export interface EmploymentType { type_id: number; name: string }
export interface ExperienceLevel { level_id: number; name: string }

export interface TaxonomySnapshot {
  domains: TaxonomyDomain[];
  roles: TaxonomyRole[];
  specializations: TaxonomySpecialization[];
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
  experienceLevels: ExperienceLevel[];
}

export const taxonomyService = {
  load: () => httpClient.get<TaxonomySnapshot>('/taxonomy', { cache: false }),
  domains: () => httpClient.get<TaxonomyDomain[]>('/taxonomy/domains', { cache: false }),
  roles: (domainId?: number) => httpClient.get<TaxonomyRole[]>(`/taxonomy/roles${domainId ? `?domain_id=${domainId}` : ''}`, { cache: false }),
  specializations: (roleName?: string) => httpClient.get<TaxonomySpecialization[]>(`/taxonomy/specializations${roleName ? `?role_name=${encodeURIComponent(roleName)}` : ''}`, { cache: false }),
  workModes: () => httpClient.get<WorkMode[]>('/taxonomy/work-modes', { cache: false }),
  employmentTypes: () => httpClient.get<EmploymentType[]>('/taxonomy/employment-types', { cache: false }),
  experienceLevels: () => httpClient.get<ExperienceLevel[]>('/taxonomy/experience-levels', { cache: false }),
};
