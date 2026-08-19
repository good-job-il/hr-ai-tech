import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import UnauthorizedAccess from "./UnauthorizedAccess"

export default function EmployerRoute() {
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

  const isAllowed =
    user.user_type === "employer" ||
    user.user_type === "recruiter" ||
    user.user_type === "team_manager" ||
    user.user_type === "hiring_manager" ||
    user.user_type === "admin"

  if (!isAllowed) {
    return <UnauthorizedAccess userType={user.user_type} requiredType="employer" />
  }

  return <Outlet />
}
