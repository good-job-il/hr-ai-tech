import { useAuth } from "@/lib/AuthContext"
import { useTranslation } from "react-i18next"
import {
  AGENCY_ADMIN_NAV,
  AGENCY_TEAM_MANAGER_NAV,
  buildAgencyNavigation,
} from "@/config/navigation/agencyNav"
import { isJobImportFeatureEnabled, JOB_IMPORT_FEATURE_FLAGS } from "@/config/jobImportFeatureFlags"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"

export default function StaffingAgencyLayout() {
  const { user, organization } = useAuth()

  const { canResource, loading: permissionsLoading } = usePermissionMatrix()

  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const role = user?.role

  const baseNav = role === "team_manager" ? AGENCY_TEAM_MANAGER_NAV : AGENCY_ADMIN_NAV

  const jobImportsVisible =
    !permissionsLoading &&
    isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.ENABLED) &&
    canResource("job_imports", "view")

  const nav = buildAgencyNavigation(baseNav, { jobImportsVisible })

  const title =
    role === "team_manager"
      ? isRtl
        ? "מנהל צוות"
        : "Team Manager"
      : role === "org_admin"
        ? isRtl
          ? "מנהל ארגון"
          : "Org Admin"
        : isRtl
          ? "מנהל גיוס"
          : "Recruitment Manager"

  return <SidebarLayout navItems={nav} roleTitle={title} platformStyle />
}
import SidebarLayout from "./SidebarLayout"
