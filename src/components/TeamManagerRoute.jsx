import { useAuth } from "@/lib/AuthContext"

export default function TeamManagerRoute() {
  const { user } = useAuth()

  if (!user || (user.role !== "team_manager" && user.role !== "admin")) {
    return <Navigate to="/candidate-dashboard" replace />
  }

  return <Outlet />
}
