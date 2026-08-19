import { useAuth } from "@/lib/AuthContext"
import { useTranslation } from "react-i18next"
import { COMPANY_ADMIN_NAV, INTERNAL_RECRUITER_NAV } from "@/config/navigation/companyNav"
import SidebarLayout from "./SidebarLayout"

export default function CompanyHRLayout() {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const role = user?.role

  const nav = role === "internal_recruiter" ? INTERNAL_RECRUITER_NAV : COMPANY_ADMIN_NAV
  const title =
    role === "internal_recruiter"
      ? isRtl
        ? "מגייס פנימי"
        : "Internal Recruiter"
      : isRtl
        ? "מנהל HR"
        : "HR Manager"

  return <SidebarLayout navItems={nav} roleTitle={title} />
}
