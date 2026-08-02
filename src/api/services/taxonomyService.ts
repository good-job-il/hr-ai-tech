import { httpClient } from '@/api/client/httpClient';

export const taxonomyService = {
  load: () => httpClient.get('/taxonomy', { cache: false }),
  domains: () => httpClient.get('/taxonomy/domains', { cache: false }),
  roles: (domainId?: number) => httpClient.get(`/taxonomy/roles${domainId ? `?domain_id=${domainId}` : ''}`, { cache: false }),
  specializations: (roleName?: string) => httpClient.get(`/taxonomy/specializations${roleName ? `?role_name=${encodeURIComponent(roleName)}` : ''}`, { cache: false }),
  reload: () => httpClient.post('/functions/loadTaxonomy'),
};
