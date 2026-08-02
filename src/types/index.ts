/**
 * Centralized Type Definitions
 * Shared types across the entire application
 */

// === USER & ROLES ===
export type UserRole = 'admin' | 'candidate' | 'employer' | 'recruiter' | 'recruitment_manager' | 'ai_analyst';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// === CANDIDATES ===
export interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  summary?: string;
  skills: string[];
  experience_years: number;
  desired_salary_min?: number;
  desired_salary_max?: number;
  resume_url?: string;
  status: 'active' | 'inactive' | 'rejected';
  created_at: string;
  updated_at: string;
}

// === EMPLOYERS ===
export interface Employer {
  id: string;
  user_id: string;
  company_name: string;
  company_logo?: string;
  website?: string;
  location?: string;
  industry?: string;
  employee_count?: string;
  billing_email: string;
  billing_status: 'active' | 'suspended' | 'trial';
  created_at: string;
  updated_at: string;
}

// === JOBS ===
export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled';

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  requirements: string[];
  location?: string;
  job_type: JobType;
  salary_min?: number;
  salary_max?: number;
  status: JobStatus;
  posted_at: string;
  expires_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// === APPLICATIONS ===
export type ApplicationStatus =
  | 'new'
  | 'reviewed'
  | 'phone_interview'
  | 'recommended'
  | 'employer_interview'
  | 'offer'
  | 'hired'
  | 'probation'
  | 'completed'
  | 'rejected';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  notes?: string;
}

// === INTERVIEWS ===
export type InterviewType = 'phone' | 'video' | 'in-person' | 'screening';

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  scheduled_at: string;
  interviewer_id: string;
  location_or_link?: string;
  notes?: string;
  feedback?: string;
  created_at: string;
}

// === NAVIGATION ===
export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon?: any;
  permissions?: UserRole[];
  badge?: number;
  children?: NavItem[];
}

// === PAGINATION ===
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// === API RESPONSES ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// === ERRORS ===
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export type Permission = 
  | 'view_candidates'
  | 'edit_candidates'
  | 'view_jobs'
  | 'create_jobs'
  | 'edit_jobs'
  | 'view_analytics'
  | 'manage_team'
  | 'view_billing'
  | 'manage_ai';
