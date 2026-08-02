import { httpClient } from '@/api/client/httpClient';

/** Explicit adapter; endpoint moves from compatibility FunctionsController in Phase 6. */
export const analyticsService = {
  dashboard: () => httpClient.post('/functions/getDashboardStats'),
};
