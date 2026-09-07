import { useAuth } from "@/lib/AuthContext"

/**
 * New tenant-aware role routing.
 * admin → /platform/dashboard
 * staffing_agency roles → /agency/...
 * organization roles → /company/...
 * candidate → /candidate/dashboard
 * org_admin with no organization yet → /agency/onboarding
 */
function getRoleHome(role, orgType, hasOrganization, intendedOrgType, profileCompleted) {
  // Platform operators
  if (role === "admin") {
    return "/platform/dashboard"
  }

  // Candidate
  if (role === "candidate") {
    return profileCompleted ? "/candidate/dashboard" : "/candidate/onboarding"
  }

  // org_admin who hasn't created their organization yet — onboard first.
  // (Only staffing_agency self-onboarding exists today.)
  if (role === "org_admin" && !hasOrganization && intendedOrgType !== "organization") {
    return "/agency/onboarding"
  }

  // Staffing agency roles
  if (orgType === "staffing_agency") {
    if (role === "recruiter") {
      return "/agency/recruiter/dashboard"
    }

    if (role === "team_manager") {
      return "/agency/team/dashboard"
    }

    if (role === "recruitment_manager") {
      return "/agency/dashboard"
    }

    if (role === "org_admin") {
      return "/agency/dashboard"
    }
  }

  // Company / internal HR roles
  if (orgType === "organization") {
    if (role === "internal_recruiter") {
      return "/company/recruiter/dashboard"
    }

    if (role === "hr_manager") {
      return "/company/dashboard"
    }

    if (role === "org_admin") {
      return "/company/dashboard"
    }
  }

  // Legacy fallbacks
  if (role === "employer") {
    return "/employer/dashboard"
  }

  return "/"
}

export default function RoleFallback() {
  const { user, isLoadingAuth, orgType, organization, intendedOrgType } = useAuth()

  if (isLoadingAuth) {
    return null
  }

  if (user) {
    const role = user.role || user.user_type

    const home = getRoleHome(role, orgType, !!organization, intendedOrgType, user.profile_completed)

    return <Navigate to={home} replace />
  }

  return <PageNotFound />
}
import { Navigate } from "react-router-dom"
import PageNotFound from "@/lib/PageNotFound"
