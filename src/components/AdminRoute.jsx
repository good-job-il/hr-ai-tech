import { useAuth } from "@/lib/AuthContext"

export default function AdminRoute() {
  const { user, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "#eaf7fb" }}
      >
        <div className="w-8 h-8 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type !== "admin") {
    return <UnauthorizedAccess userType={user.user_type} requiredType="admin" />
  }

  return <Outlet />
}
import { Navigate, Outlet } from "react-router-dom"
import UnauthorizedAccess from "./UnauthorizedAccess"
