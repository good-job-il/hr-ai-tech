import { useAuth } from "@/lib/AuthContext"

export default function RecruiterRoute() {
  const { user } = useAuth()

  if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
    return <Navigate to="/candidate-dashboard" replace />
  }

  return <Outlet />
}
