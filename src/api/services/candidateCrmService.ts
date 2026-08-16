import { httpClient } from '@/api/client/httpClient';
import { candidateService } from './candidateService';
import { applicationService } from './applicationService';
import { interviewService } from './interviewService';
import { communicationService } from './communicationService';
import { fileService } from './fileService';

export const candidateCrmService = {
  get: (id: number | string) => candidateService.get(id),
  update: (id: number | string, payload: Record<string, unknown>) => candidateService.update(id, payload),
  applications: (candidateId: number, candidateEmail?: string | null) => applicationService.list({
    ...(candidateEmail ? { candidate_email: candidateEmail } : { candidate_id: candidateId }),
    sort: 'created_date', order: 'DESC', limit: 20,
  }),
  interviews: (candidateId: number) => interviewService.list({ candidate_id: candidateId, sort: 'date', order: 'DESC', limit: 20 }),
  notes: (id: number) => httpClient.get<unknown[]>(`/candidates/${id}/notes`, { cache: false }),
  tags: (id: number) => httpClient.get<unknown[]>(`/candidates/${id}/tags`, { cache: false }),
  documents: (id: number) => httpClient.get<unknown[]>(`/candidates/${id}/documents`, { cache: false }),
  timeline: (id: number) => httpClient.get<unknown[]>(`/candidates/${id}/timeline`, { cache: false }),
  communications: (id: number) => communicationService.list({ candidate_id: id, limit: 30 }),
  addNote: (id: number, payload: Record<string, unknown>) => httpClient.post(`/candidates/${id}/notes`, payload),
  updateNote: (id: number, payload: Record<string, unknown>) => httpClient.patch(`/candidates/notes/${id}`, payload),
  deleteNote: (id: number) => httpClient.delete(`/candidates/notes/${id}`),
  addTag: (id: number, tag: string, color: string) => httpClient.post(`/candidates/${id}/tags`, { tag, color }),
  deleteTag: (id: number) => httpClient.delete(`/candidates/tags/${id}`),
  addTimeline: (id: number, payload: Record<string, unknown>) => httpClient.post(`/candidates/${id}/timeline`, payload),
  scheduleInterview: (payload: import('./interviewService').CreateInterviewInput) => interviewService.create(payload),
  updateInterview: (id: number, payload: import('./interviewService').UpdateInterviewInput) => interviewService.update(id, payload),
  async uploadDocument(id: number, file: File, doc_type: string) {
    const { file_url } = await fileService.upload(file);
    return httpClient.post(`/candidates/${id}/documents`, {
      doc_type, filename: file.name, file_url, file_size: file.size, is_latest_cv: doc_type === 'cv',
    });
  },
  logCommunication: communicationService.create,
  presentCandidate: communicationService.presentCandidate,
};
