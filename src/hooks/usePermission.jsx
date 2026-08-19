import { useAuth } from "@/lib/AuthContext"

export const usePermission = () => {
  const { user } = useAuth()

  const hasPermission = (allowedTypes) => {
    if (!user) {
      return false
    }

    return allowedTypes.includes(user.user_type)
  }

  const isCandidateOnly = () => user?.user_type === "candidate"

  const isEmployer = () =>
    ["employer", "recruiter", "team_manager", "hiring_manager", "admin"].includes(user?.user_type)

  const isAdmin = () => user?.user_type === "admin"

  const isRecruiter = () => ["recruiter", "hiring_manager", "admin"].includes(user?.user_type)

  return {
    user,
    hasPermission,
    isCandidateOnly,
    isEmployer,
    isAdmin,
    isRecruiter,
  }
}
