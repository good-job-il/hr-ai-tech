/**
 * @deprecated — Legacy layout. All recruiter routes now use AgencyRecruiterLayout.
 * /recruiter/* redirects to /agency/recruiter/* via App.jsx.
 * Kept only to avoid import errors; remove in Phase D cleanup.
 */
import { Navigate } from "react-router-dom"

export default function RecruiterLayout() {
  return <Navigate to="/agency/recruiter/dashboard" replace />
}
