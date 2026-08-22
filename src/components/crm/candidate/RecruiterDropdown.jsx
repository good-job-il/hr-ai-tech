import { useState, useEffect, useRef } from "react"
import { userService } from "@/api/services/userService"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"

export default function RecruiterDropdown({ currentRecruiterId, onSelect }) {
  const { t } = useTranslation()

  const { user } = useAuth()

  const [open, setOpen] = useState(false)

  const [recruiters, setRecruiters] = useState([])

  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(false)

  const ref = useRef(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setLoading(true)

    const teamOnly = user?.role === "team_manager"

    userService
      .list({
        limit: 200,
        is_active: true,
        ...(teamOnly ? { role: "recruiter" } : {}),
      })
      .then((users) => {
        if (teamOnly) {
          setRecruiters(users)

          return
        }

        const RECRUITER_ROLES = ["recruiter", "team_manager", "recruitment_manager", "admin"]

        const filtered = users.filter(
          (u) => RECRUITER_ROLES.includes(u.role) || RECRUITER_ROLES.includes(u.user_type),
        )

        setRecruiters(filtered)
      })
      .finally(() => setLoading(false))
  }, [open, user?.role])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClick)

    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = recruiters.filter(
    (r) =>
      !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-[#374151] px-4 py-2.5 rounded-xl border border-[#E4ECFF] bg-white hover:border-[#7C3AED] transition-all"
      >
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#7C3AED]" />

          <span className={currentRecruiterId ? "text-[#7C3AED]" : "text-[#94A3B8]"}>
            {currentRecruiterId || t("candidateCRM.recruiterDropdown.selectRecruiter")}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#94A3B8] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E4ECFF] rounded-xl shadow-xl z-50 max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-[#F0F1F5]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#F7F8FC] rounded-lg">
              <Search className="w-3.5 h-3.5 text-[#94A3B8]" />

              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("candidateCRM.recruiterDropdown.search")}
                className="bg-transparent text-xs font-semibold text-[#374151] flex-1 outline-none placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="py-4 text-center text-xs text-[#94A3B8]">
                {t("candidateCRM.recruiterDropdown.loading")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#94A3B8]">
                {t("candidateCRM.recruiterDropdown.noRecruiters")}
              </div>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelect(r.id, r.full_name, r.email)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={`w-full text-right flex items-center gap-3 px-4 py-2.5 hover:bg-[#EEF4FF] transition-colors ${r.id === currentRecruiterId ? "bg-[#EEF4FF]" : ""}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {r.full_name?.slice(0, 1) || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#0F172A] truncate">{r.full_name}</div>

                    <div className="text-xs text-[#94A3B8] truncate">{r.email}</div>
                  </div>

                  {r.id === currentRecruiterId && (
                    <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
import { ChevronDown, UserCheck, Search } from "lucide-react"
