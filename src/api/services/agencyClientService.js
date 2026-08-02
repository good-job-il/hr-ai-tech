import { httpClient } from '@/api/client/httpClient';
import { buildQuery, asList } from './resourceService';

export const agencyClientService = {
  async list(query = {}) {
    return asList(await httpClient.get(`/agency-clients${buildQuery(query)}`, { cache: false }));
  },
  get(id) {
    return httpClient.get(`/agency-clients/${id}`, { cache: false });
  },
  create(payload) {
    return httpClient.post('/agency-clients', payload);
  },
  update(id, payload) {
    return httpClient.patch(`/agency-clients/${id}`, payload);
  },
  archive(id) {
    return httpClient.delete(`/agency-clients/${id}`);
  },
};
