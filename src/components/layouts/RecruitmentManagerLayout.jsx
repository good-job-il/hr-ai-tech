/**
 * @deprecated — Legacy layout. All recruitment manager routes now use StaffingAgencyLayout.
 * /recruitment/* redirects to /agency/* via App.jsx.
 * Kept only to avoid import errors; remove in Phase D cleanup.
 */

export default function RecruitmentManagerLayout() {
  return <Navigate to="/agency/dashboard" replace />
}
