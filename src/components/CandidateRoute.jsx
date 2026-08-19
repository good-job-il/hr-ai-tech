import { useAuth } from "@/lib/AuthContext"

export default function CandidateRoute() {
  const { user } = useAuth()

  if (!user || user.role !== "candidate") {
    return <Navigate to="/employer/dashboard" replace />
  }

  return <Outlet />
}
