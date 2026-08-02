import { base44 } from '@/api/base44Client';

export const agencyClientService = {
  list(filters = {}, limit = 300) {
    return base44.entities.AgencyClient.filter(filters, 'name', limit);
  },
  get(id) {
    return base44.entities.AgencyClient.get(id);
  },
  create(payload) {
    return base44.entities.AgencyClient.create(payload);
  },
  update(id, payload) {
    return base44.entities.AgencyClient.update(id, payload);
  },
  archive(id) {
    return base44.entities.AgencyClient.delete(id);
  },
};
