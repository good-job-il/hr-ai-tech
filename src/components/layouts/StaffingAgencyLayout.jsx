import { useAuth } from "@/lib/AuthContext"
import { useTranslation } from "react-i18next"
import { AGENCY_ADMIN_NAV, AGENCY_TEAM_MANAGER_NAV } from "@/config/navigation/agencyNav"

export default function StaffingAgencyLayout() {
  const { user } = useAuth()

  const { i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const role = user?.role

  const nav = role === "team_manager" ? AGENCY_TEAM_MANAGER_NAV : AGENCY_ADMIN_NAV

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

  return <SidebarLayout navItems={nav} roleTitle={title} />
}
