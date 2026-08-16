import { ResourceService, ResourceQuery } from './resourceService';
import type { AuthUser } from './authService';
import type { UserRole } from './authService';
import { httpClient } from '@/api/client/httpClient';

export interface UserQuery extends ResourceQuery {
  sort?: 'created_date' | 'updated_date' | 'full_name' | 'email' | 'role';
  role?: UserRole;
  organization_id?: number;
  is_active?: boolean;
  search?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
  organization_id?: number | null;
  is_active?: boolean;
}

export type OrganizationMemberRole = 'recruiter' | 'team_manager' | 'recruitment_manager' | 'hr_manager' | 'internal_recruiter';
export interface InviteOrganizationUserInput {
  email: string;
  full_name: string;
  phone?: string;
  role: OrganizationMemberRole;
  is_active?: boolean;
}

export interface UpdateUserInput {
  full_name?: string;
  phone?: string;
  role?: UserRole;
  organization_id?: number | null;
  org_type?: 'staffing_agency' | 'organization' | null;
  team_manager_id?: number | null;
  team_id?: number | null;
  recruitment_manager_id?: number | null;
  employer_company_id?: number | null;
  display_role_name?: string;
  is_active?: boolean;
}

class UserService extends ResourceService<AuthUser, UserQuery, CreateUserInput, UpdateUserInput> {
  invite(payload: InviteOrganizationUserInput) {
    return httpClient.post<AuthUser>('/users/invite', payload);
  }
}

export const userService = new UserService('/users');
