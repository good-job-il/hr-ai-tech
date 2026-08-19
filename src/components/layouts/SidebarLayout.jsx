/**
 * SidebarLayout — shared sidebar shell used by all layout types.
 * Accepts: navItems, roleTitle
 */
import { useState } from "react"
import { useLocation } from "react-router-dom"

import { useAuth } from "@/lib/AuthContext"
import { useTranslation } from "react-i18next"

const THEME = {
  activeBg: "bg-[#EEF4FF] text-[#6C4DFF]",
  activeText: "text-[#6C4DFF]",
  hoverBg: "hover:bg-[#F5F3FF]",
  childActive: "bg-[#EEF4FF] text-[#6C4DFF]",
  sidebarBg: "bg-white border-[#EDE9FE]",
  childBorder: "border-[#DDD6FE]",
  inactiveText: "text-[#4B5563]",
}

export default function SidebarLayout({ navItems = [], roleTitle = "", platformStyle = false }) {
  const { user, logout, orgType, organization, isImpersonating, exitOrganization } = useAuth()

  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)

  const [expandedMenu, setExpandedMenu] = useState(null)

  const [exiting, setExiting] = useState(false)

  const handleExitWorkspace = async () => {
    if (exiting) {
      return
    }

    setExiting(true)

    try {
      await exitOrganization()
      window.location.href = "/platform/organizations/staffing"
    } finally {
      setExiting(false)
    }
  }

  const getLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label || "")

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/")

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  const renderNavItems = (items) =>
    items.map((item) => {
      const active = isActive(item.route)

      const hasChildren = item.children?.length > 0

      const isExpanded = expandedMenu === item.id

      const showChildren = isExpanded || (platformStyle && active)

      const itemBaseClass = platformStyle
        ? "min-h-[46px] rounded-[14px] px-4 py-3 text-[13px] font-bold"
        : "rounded-xl px-3 py-2.5 text-sm font-medium"

      const activeClass = platformStyle
        ? "bg-[#F5EDFF] text-[#7C3AED] shadow-[inset_0_0_0_1px_rgba(124,58,237,0.02)]"
        : `${THEME.activeBg} font-semibold`

      const inactiveClass = platformStyle
        ? "text-[#59637C] hover:bg-[#F8F5FF] hover:text-[#6C4DFF]"
        : `${THEME.inactiveText} ${THEME.hoverBg}`

      return (
        <div key={item.id}>
          {hasChildren ? (
            <>
              <button
                onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
                className={`flex w-full items-center justify-between transition-all ${itemBaseClass}
                ${active ? activeClass : inactiveClass}`}
              >
                <span className="flex items-center gap-3.5">
                  {item.icon && (
                    <item.icon
                      className={`h-[19px] w-[19px] shrink-0 ${active ? (platformStyle ? "text-[#7C3AED]" : THEME.activeText) : platformStyle ? "text-[#68728A]" : "text-[#9CA3AF]"}`}
                      strokeWidth={1.8}
                    />
                  )}

                  {getLabel(item)}

                  {item.badge && (
                    <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-[#A0A8B9] transition-transform ${showChildren ? "rotate-180" : ""}`}
                />
              </button>

              {showChildren && (
                <div
                  className={`${isRtl ? "mr-7 border-r pr-2" : "ml-7 border-l pl-2"} mt-1 space-y-0.5 ${platformStyle ? "border-[#E7E1F7]" : THEME.childBorder}`}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      to={child.route}
                      onClick={() => setMobileOpen(false)}
                      className={`${platformStyle ? "rounded-[11px] text-xs font-semibold" : "rounded-lg text-sm"} block px-3 py-2 transition-all
                      ${
                        isActive(child.route)
                          ? platformStyle
                            ? "bg-[#F7F1FF] text-[#7C3AED]"
                            : `${THEME.childActive} font-semibold`
                          : platformStyle
                            ? "text-[#7A8498] hover:bg-[#FAF8FF] hover:text-[#6C4DFF]"
                            : `text-[#6B7280] hover:text-[#6C4DFF] ${THEME.hoverBg}`
                      }`}
                    >
                      {getLabel(child)}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Link
              to={item.route}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3.5 transition-all ${itemBaseClass}
              ${active ? activeClass : inactiveClass}`}
            >
              {item.icon && (
                <item.icon
                  className={`h-[19px] w-[19px] shrink-0 ${active ? (platformStyle ? "text-[#7C3AED]" : THEME.activeText) : platformStyle ? "text-[#68728A]" : "text-[#9CA3AF]"}`}
                  strokeWidth={1.8}
                />
              )}

              <span className="flex-1">{getLabel(item)}</span>

              {item.badge && (
                <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </div>
      )
    })

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`flex min-h-screen ${platformStyle ? "bg-[#F5F8FF]" : "bg-[#F8F7FF]"}`}
    >
      <aside
        className={`fixed inset-y-0 ${isRtl ? "right-0" : "left-0"} z-40 flex flex-col transform transition-transform md:translate-x-0 ${platformStyle ? "w-[290px] border-[#E9EDF6] bg-[#FBFCFF]" : `w-64 ${THEME.sidebarBg}`} ${mobileOpen ? "translate-x-0" : isRtl ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div
          className={`flex h-[82px] shrink-0 items-center ${platformStyle ? "justify-center border-b border-[#EEF1F6] px-7" : "border-b border-[#EDE9FE] px-5"}`}
        >
          <Logo
            href={platformStyle ? "/platform/dashboard" : undefined}
            className={platformStyle ? "max-h-[54px]" : ""}
          />
        </div>

        {/* Nav */}
        <div
          className={
            platformStyle
              ? "m-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#E9EDF6] bg-white shadow-[0_8px_30px_rgba(60,74,125,0.045)]"
              : "flex min-h-0 flex-1 flex-col"
          }
        >
          <nav
            className={`flex-1 overflow-y-auto ${platformStyle ? "space-y-1.5 px-3 py-4" : "space-y-0.5 px-3 py-4"}`}
          >
            {renderNavItems(navItems)}
          </nav>

          {/* Organization Context Block */}
          <div
            className={
              platformStyle
                ? "border-t border-[#EEF1F6] p-3"
                : "border-t border-[#EDE9FE] bg-[#F5F3FF] px-4 py-3"
            }
          >
            {orgType === "platform" ? (
              platformStyle ? (
                <button className="flex w-full items-center gap-3 rounded-[17px] border border-[#E8E1FA] bg-[linear-gradient(135deg,#FBF9FF,#F4F1FF)] p-3 text-start transition hover:border-[#D9CCFA]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#7C3AED] shadow-[0_4px_12px_rgba(105,78,190,0.08)]">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[#6C4DFF]">
                      {isRtl ? "מרכז AI למנהלים" : "AI Center for Managers"}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] font-semibold text-[#A19AB5]">
                      {isRtl ? "תובנות חכמות על המערכת" : "Smart platform insights"}
                    </p>
                  </div>

                  {isRtl ? (
                    <ChevronLeft className="h-4 w-4 text-[#7C3AED]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#7C3AED]" />
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF]">
                    <ShieldCheck className="h-4 w-4 text-[#6C4DFF]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#1F2937]">
                      {t("nav.platform.controlPanel")}
                    </p>

                    <p className="text-[10px] text-[#9CA3AF]">Super Admin</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-[#6C4DFF]" />
                </div>

                <div className="min-w-0">
                  {organization?.name && (
                    <p className="text-xs font-semibold text-[#1F2937] truncate">
                      {organization.name}
                    </p>
                  )}

                  <p className="text-[10px] text-[#9CA3AF] truncate">
                    {orgType === "staffing_agency"
                      ? t("platform.orgs.staffing")
                      : orgType === "organization"
                        ? t("platform.orgs.companies")
                        : orgType}

                    {user?.role &&
                      ` · ${
                        user.role === "org_admin"
                          ? isRtl
                            ? "מנהל ארגון"
                            : "Org Admin"
                          : user.role === "recruitment_manager"
                            ? isRtl
                              ? "מנהל גיוס"
                              : "Recruitment Manager"
                            : user.role === "team_manager"
                              ? isRtl
                                ? "מנהל צוות"
                                : "Team Manager"
                              : user.role === "hr_manager"
                                ? isRtl
                                  ? "מנהל HR"
                                  : "HR Manager"
                                : user.role === "recruiter"
                                  ? isRtl
                                    ? "מגייס"
                                    : "Recruiter"
                                  : user.role === "internal_recruiter"
                                    ? isRtl
                                      ? "מגייס פנימי"
                                      : "Internal Recruiter"
                                    : user.role
                      }`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col ${platformStyle ? (isRtl ? "md:mr-[290px]" : "md:ml-[290px]") : isRtl ? "md:mr-64" : "md:ml-64"}`}
      >
        {isImpersonating && (
          <div className="bg-amber-400 text-amber-950 text-xs sm:text-sm font-bold px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
            <span>
              {isRtl
                ? `אתה צופה בארגון "${organization?.name || ""}" כאדמין פלטפורמה`
                : `You are viewing "${organization?.name || "this organization"}" as a platform admin`}
            </span>

            <button
              onClick={handleExitWorkspace}
              disabled={exiting}
              className="underline underline-offset-2 hover:no-underline disabled:opacity-60"
            >
              {exiting
                ? isRtl
                  ? "יוצא…"
                  : "Exiting…"
                : isRtl
                  ? "יציאה מהארגון"
                  : "Exit organization"}
            </button>
          </div>
        )}

        <DashboardHeader
          user={user}
          roleTitle={roleTitle}
          onMenuToggle={() => setMobileOpen(true)}
          onLogout={handleLogout}
          showMenuButton={true}
          platformStyle={platformStyle}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          <div className="p-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <button
            onClick={() => setMobileOpen(false)}
            className={`fixed top-4 ${isRtl ? "left-4" : "right-4"} z-50 md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg`}
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  )
}
