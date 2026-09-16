export interface Candidate {
  id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  domain_id?: number
  domain_name?: string
  role_id?: number
  role_name?: string
  specialization_id?: number
  specialization_name?: string
  experience_years?: number
  desired_salary_min?: number
  desired_salary_max?: number
  resume_url?: string
  skills?: string[]
  languages?: string[]
  status: "new" | "contacted" | "interview" | "offer" | "hired" | "rejected" | "inactive"
  summary?: string
  notes?: string
  created_date: string
  updated_date: string
  created_by: string
}

export interface Job {
  id: string
  title: string
  company: string
  company_initials?: string
  company_color?: string
  location?: string
  salary_min?: number
  salary_max?: number
  /** @deprecated compatibility mirror; use employment_type_id and work_mode_id. */
  type: "full" | "part" | "daily" | "remote"
  employment_type_id?: number | null
  work_mode_id?: number | null
  source?: "manual" | "import" | "crawler" | "api"
  description?: string
  domain_id?: number
  role_id?: number
  specialization_id?: number
  category?: string | null
  required_skills?: string[] | null
  preferred_skills?: string[] | null
  role_domain?: string | null
  seniority?: "junior" | "mid" | "senior" | "lead" | "manager" | "director" | "any"
  years_experience_required?: number | null
  employer_company_id?: number | null
  created_by_user_id?: number | null
  recruiter_id?: number | null
  team_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  job_code?: string | null
  apply_email?: string | null
  apply_url?: string | null
  source_job_record_id?: number | null
  views: number
  is_closed: boolean
  state: "draft" | "open" | "on_hold" | "filled" | "closed"
  is_anonymous: boolean
  show_company_name?: boolean
  show_company_info?: boolean
  show_contact_details?: boolean
  contact_email?: string
  contact_phone?: string
  applications_count: number
  employer_id: string
  created_date: string
  updated_date: string
  created_by: string
}

export interface Application {
  id: string
  job_id: string
  job_title?: string
  company?: string
  employer_id: string
  candidate_name: string
  candidate_email?: string | null
  candidate_phone?: string
  resume_url?: string
  resume_filename?: string
  cover_letter?: string
  desired_salary_min?: number
  desired_salary_max?: number
  location?: string
  status:
    | "new"
    | "reviewed"
    | "phone_interview"
    | "recommended"
    | "employer_interview"
    | "offer"
    | "hired"
    | "probation"
    | "completed"
    | "rejected"
  match_score?: number
  match_reason?: string
  notes?: string
  assigned_to?: string
  source?: "app" | "linkedin" | "facebook" | "jobsite" | "other"
  created_date: string
  updated_date: string
  created_by: string
}

export interface Interview {
  id: string
  application_id: string
  job_id: string
  job_title?: string
  employer_id: string
  candidate_name: string
  candidate_email: string
  date: string
  time: string
  type: "phone" | "video" | "in_person"
  location_or_link?: string
  notes?: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
  created_date: string
  updated_date: string
  created_by: string
}

export interface Company {
  id: string
  name: string
  industry?: string
  initials?: string
  color?: string
  logo_url?: string
  job_count: number
  created_date: string
  updated_date: string
  created_by: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role:
    | "candidate"
    | "employer"
    | "recruiter"
    | "recruitment_manager"
    | "team_manager"
    | "ai_analyst"
    | "admin"
  created_date: string
  updated_date: string
}
