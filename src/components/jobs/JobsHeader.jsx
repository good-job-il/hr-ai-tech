import { useState } from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"

export default function JobsHeader() {
  const { user } = useAuth()

  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)

  const NAV = [
    { label: t("common.jobs"), href: "/jobs" },
    { label: t("common.companies"), href: "/companies" },
    { label: isRtl ? "AI לקריירה" : "AI Career", href: "/#ai-center" },
    { label: isRtl ? "איך זה עובד?" : "How it works?", href: "/#how" },
    { label: t("common.about"), href: "/#about" },
    { label: isRtl ? "בלוג" : "Blog", href: "/#blog" },
    { label: isRtl ? "משאבים" : "Resources", href: "/#resources" },
  ]

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(26px)",
        WebkitBackdropFilter: "blur(26px)",
        borderBottom: "1px solid rgba(221,235,255,0.85)",
        boxShadow: "0 18px 55px rgba(79,124,255,0.10)",
      }}
    >
      <div className="max-w-[1540px] mx-auto px-7 h-[82px] flex items-center justify-between">
        <Link to="/" className="flex items-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="HeadHunter HR-Tech"
            className="h-[58px] w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {NAV.map((link, i) => {
            const active = location.pathname === link.href

            return (
              <Link
                key={i}
                to={link.href}
                className="relative px-4 py-2 text-[15px] font-extrabold rounded-2xl transition-all"
                style={{
                  color: active ? "#7C3AED" : "#334155",
                  background: active ? "rgba(124,58,237,0.08)" : "transparent",
                }}
              >
                {link.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -14,
                      [isRtl ? "right" : "left"]: "50%",
                      transform: "translateX(50%)",
                      width: 34,
                      height: 3,
                      borderRadius: 8,
                      background: "linear-gradient(90deg,#8B5CF6,#2F80FF)",
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/jobs"
            className="hidden md:inline-flex items-center gap-2 h-12 px-6 rounded-lg font-black text-[#6C4DFF] bg-white border border-[#DDEBFF] shadow-[0_10px_30px_rgba(79,124,255,0.10)]"
          >
            <Search className="w-4 h-4" />
            {t("jobs.searchButton")}
          </Link>

          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center h-12 px-7 text-[15px] font-black rounded-lg text-[#6C4DFF] bg-white border border-[#D8E5FF] shadow-[0_10px_30px_rgba(79,124,255,0.08)]"
              >
                {t("common.login")}
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-12 px-7 text-[15px] font-black rounded-lg text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#A855F7 0%,#6C4DFF 48%,#2F80FF 100%)",
                  boxShadow: "0 18px 42px rgba(108,77,255,0.35)",
                }}
              >
                <UserPlus className="w-4 h-4" />
                {isRtl ? "הרשמה כמועמד חדש" : "Register as Candidate"}
              </Link>
            </>
          ) : (
            <>
              <button className="relative w-12 h-12 rounded-2xl bg-white border border-[#DDEBFF] flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5 text-[#6C4DFF]" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#7C3AED] border-2 border-white" />
              </button>

              <Link
                to={
                  user.role === "admin"
                    ? "/admin/dashboard"
                    : user.role === "candidate"
                      ? "/candidate-dashboard"
                      : "/employer/dashboard"
                }
                className="inline-flex items-center h-12 px-7 text-[15px] font-black rounded-lg text-white"
                style={{
                  background: "linear-gradient(135deg,#8B5CF6,#2F80FF)",
                  boxShadow: "0 18px 42px rgba(108,77,255,0.30)",
                }}
              >
                {t("common.dashboard")}
              </Link>
            </>
          )}

          <button
            className="lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center text-[#334155] bg-white border border-[#DDEBFF]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-[#DDEBFF] px-7 py-5 space-y-2">
          {NAV.map((link, i) => (
            <Link
              key={i}
              to={link.href}
              className="block text-[#334155] text-[16px] py-3 font-black hover:text-[#7C3AED]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
