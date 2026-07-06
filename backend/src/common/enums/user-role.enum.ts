export enum UserRole {
  CANDIDATE = 'candidate',
  EMPLOYER = 'employer',
  RECRUITER = 'recruiter',
  TEAM_MANAGER = 'team_manager',
  RECRUITMENT_MANAGER = 'recruitment_manager',
  ORG_ADMIN = 'org_admin',
  ADMIN = 'admin',
  HR_MANAGER = 'hr_manager',
  INTERNAL_RECRUITER = 'internal_recruiter',
}


export const ORG_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.RECRUITER,
  UserRole.HR_MANAGER,
  UserRole.INTERNAL_RECRUITER,
];

