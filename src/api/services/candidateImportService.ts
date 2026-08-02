import { ResourceService, ResourceQuery } from './resourceService';
import { httpClient } from '@/api/client/httpClient';
export interface ImportBatchRecord { id: number; [key: string]: unknown }
class CandidateImportService extends ResourceService<ImportBatchRecord, ResourceQuery> {
  constructor() { super('/candidates/import-batches'); }
  importCandidates(payload: Record<string, unknown>) { return httpClient.post('/functions/importCandidatesFromFile', payload); }
  importResumes(payload: Record<string, unknown>) { return httpClient.post('/functions/importResumeFiles', payload); }
  parseBatch(payload: Record<string, unknown>) { return httpClient.post('/functions/parseResumeBatch', payload); }
  validateBatch(payload: Record<string, unknown>) { return httpClient.post('/functions/validateImportBatch', payload); }
  createBulk(payload: Record<string, unknown>) { return httpClient.post('/functions/createBulkCandidates', payload); }
}
export const candidateImportService = new CandidateImportService();
