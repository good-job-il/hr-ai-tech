import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import PageNotFound from '@/lib/PageNotFound';

/**
 * New tenant-aware role routing.
 * admin → /platform/dashboard
 * staffing_agency roles → /agency/...
 * organization roles → /company/...
 * candidate → /candidate/dashboard
 */
function getRoleHome(role, orgType) {
  // Platform operators
  if (role === 'admin') return '/platform/dashboard';

  // Candidate
  if (role === 'candidate') return '/candidate/dashboard';

  // Staffing agency roles
  if (orgType === 'staffing_agency') {
    if (role === 'recruiter') return '/agency/recruiter/dashboard';
    if (role === 'team_manager') return '/agency/team/dashboard';
    if (role === 'recruitment_manager') return '/agency/dashboard';
    if (role === 'org_admin') return '/agency/dashboard';
  }

  // Company / internal HR roles
  if (orgType === 'organization') {
    if (role === 'internal_recruiter') return '/company/recruiter/dashboard';
    if (role === 'hr_manager') return '/company/dashboard';
    if (role === 'org_admin') return '/company/dashboard';
  }

  // Legacy fallbacks
  if (role === 'employer') return '/employer/dashboard';

  return '/';
}

export default function RoleFallback() {
  const { user, isLoadingAuth, orgType } = useAuth();

  if (isLoadingAuth) return null;

  if (user) {
    const role = user.role || user.user_type;
    const home = getRoleHome(role, orgType);
    return <Navigate to={home} replace />;
  }

  return <PageNotFound />;
}
