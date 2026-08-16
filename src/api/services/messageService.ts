import { httpClient } from '@/api/client/httpClient';
import { asList, buildQuery } from './resourceService';
import type { PaginatedResponse } from '@/types/api';

export interface MessageRecord {
  id: number;
  application_id: number;
  sender_email: string;
  sender_role: 'employer' | 'candidate' | 'recruiter' | null;
  content: string;
  is_read: boolean;
  created_date: string;
}

export const messageService = {
  async list(query: { application_id: number; is_read?: boolean; limit?: number }): Promise<MessageRecord[]> {
    const response = await httpClient.get<MessageRecord[] | PaginatedResponse<MessageRecord>>(
      `/messages${buildQuery({ ...query, sort: 'created_date', order: 'ASC' })}`,
      { cache: false },
    );
    return asList(response);
  },
  send: (applicationId: number, content: string) =>
    httpClient.post<MessageRecord>('/messages', { application_id: applicationId, content }),
  markRead: (id: number) => httpClient.patch<MessageRecord>(`/messages/${id}`, { is_read: true }),
  markApplicationRead: (applicationId: number) => httpClient.patch<void>(`/messages/read-all/${applicationId}`),
};
