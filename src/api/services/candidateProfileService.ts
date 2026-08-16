import { httpClient } from '@/api/client/httpClient';

export interface CandidateProfileRecord {
  id: number;
  user_email: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  title: string | null;
  summary: string | null;
  skills: string[] | null;
  experience_years: number | null;
  education: unknown[] | null;
  experience: unknown[] | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  job_type: string | null;
  categories: string[] | null;
  is_public: boolean;
  is_open_to_work: boolean;
  resume_url: string | null;
}

export interface CandidateProfileInput {
  full_name: string;
  phone?: string | null;
  location?: string | null;
  title?: string | null;
  summary?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
  education?: unknown[] | null;
  experience?: unknown[] | null;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  job_type?: string | null;
  categories?: string[] | null;
  is_public?: boolean;
  is_open_to_work?: boolean;
  resume_url?: string | null;
}

export const candidateProfileService = {
  me: () => httpClient.get<CandidateProfileRecord | null>('/candidates/profiles/me', { cache: false }),
  create: (payload: CandidateProfileInput) => httpClient.post<CandidateProfileRecord>('/candidates/profiles', payload),
  update: (payload: Partial<CandidateProfileInput>) =>
    httpClient.patch<CandidateProfileRecord>('/candidates/profiles/me', payload),
};
