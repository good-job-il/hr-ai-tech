/**
 * @deprecated — Legacy layout. No active routes use this.
 * All /admin/* routes redirect to /platform/* via App.jsx.
 * Kept only to avoid import errors; remove in Phase D cleanup.
 */

export default function AdminLayout() {
  return <Navigate to="/platform/dashboard" replace />
}
import { Navigate } from "react-router-dom"
