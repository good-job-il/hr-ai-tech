import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

export default function EmployerSettingsRoute() {
  const { user, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return null
  }

  if (!user || (user.role !== "employer" && user.role !== "admin")) {
    return <Navigate to="/hiring-manager/dashboard" replace />
  }

  return <Outlet />
}
