import { ResourceService, ResourceQuery } from './resourceService';
import { httpClient } from '@/api/client/httpClient';

export interface OrganizationRecord {
  id: number;
  name: string;
  org_type: 'staffing_agency' | 'organization';
  status: 'active' | 'suspended' | 'inactive';
  plan?: string;
  contact_email?: string | null;
  created_date?: string;
  [key: string]: unknown;
}

class OrganizationService extends ResourceService<OrganizationRecord, ResourceQuery> {
  constructor() { super('/organizations'); }
  onboardAgency(payload: { name: string; contact_email?: string }) {
    return httpClient.post<OrganizationRecord>('/organizations/onboard-agency', payload);
  }
}

export const organizationService = new OrganizationService();
