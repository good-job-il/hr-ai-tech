import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

export default function HiringManagerRoute() {
  const { user, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return null // Don't render until auth is checked
  }

  if (
    !user ||
    !["hiring_manager", "employer", "recruiter", "team_manager", "admin"].includes(user.role)
  ) {
    return <Navigate to="/candidate-dashboard" replace />
  }

  return <Outlet />
}
