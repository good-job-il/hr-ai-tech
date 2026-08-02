import { ResourceService, ResourceQuery } from './resourceService';
import { httpClient } from '@/api/client/httpClient';
export interface ImportSourceRecord { id: number; [key: string]: unknown }
class ImportSourceService extends ResourceService<ImportSourceRecord, ResourceQuery> {
  constructor() { super('/import-sources'); }
  crawl(payload: Record<string, unknown>) { return httpClient.post('/functions/crawlCareerPage', payload); }
}
export const importSourceService = new ImportSourceService();
