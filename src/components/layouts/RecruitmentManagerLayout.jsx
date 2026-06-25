/**
 * @deprecated — Legacy layout. All recruitment manager routes now use StaffingAgencyLayout.
 * /recruitment/* redirects to /agency/* via App.jsx.
 * Kept only to avoid import errors; remove in Phase D cleanup.
 */
import { Navigate } from 'react-router-dom';

export default function RecruitmentManagerLayout() {
  return <Navigate to="/agency/dashboard" replace />;
}