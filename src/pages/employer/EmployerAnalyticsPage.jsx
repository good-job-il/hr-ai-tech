import { useState, useEffect } from "react"
import { jobService } from "@/api/services/jobService"
import { interviewService } from "@/api/services/interviewService"
import { applicationService } from "@/api/services/applicationService"
import { useAuth } from "@/lib/AuthContext"
import { Users, Briefcase, Clock, CheckCircle } from "lucide-react"

function StatCard({ icon: IconComp, label, value, color = "#7C3AED", sub }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "15" }}
      >
        <IconComp className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-[#0F172A]">{value}</div>
        <div className="text-sm font-semibold text-[#64748B]">{label}</div>
        {sub && <div className="text-xs text-[#94A3B8] mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function EmployerAnalyticsPage() {
  const { user } = useAuth()

  const [data, setData] = useState(null)

  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    if (!user?.email) {
      return
    }

    const load = async () => {
      setLoading(true)
      setLoadError("")

      try {
        const [jobs, applications, interviews] = await Promise.all([
          jobService.list({ limit: 200 }),
          applicationService.list({ limit: 200 }),
          interviewService.list({ limit: 200 }),
        ])

        const openJobs = jobs.filter((j) => !j.is_closed)

        const closedJobs = jobs.filter((j) => j.is_closed)

        const hired = applications.filter((a) => a.status === "hired")

        const inProgress = applications.filter((a) =>
          ["phone_interview", "recommended", "employer_interview", "offer", "probation"].includes(
            a.status,
          ),
        )

        const scheduled = interviews.filter((i) => i.status === "scheduled")

        const completed = interviews.filter((i) => i.status === "completed")

        setData({
          openJobs: openJobs.length,
          closedJobs: closedJobs.length,
          totalApps: applications.length,
          hired: hired.length,
          inProgress: inProgress.length,
          scheduledInterviews: scheduled.length,
          completedInterviews: completed.length,
        })
      } catch (error) {
        setData(null)
        setLoadError(error?.message || "Unable to load analytics")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.email])

  const stats = [
    {
      icon: Briefcase,
      label: "משרות פתוחות",
      value: data?.openJobs ?? "—",
      color: "#7C3AED",
      sub: `${data?.closedJobs ?? 0} סגורות`,
    },
    {
      icon: Users,
      label: "סה״כ מועמדויות",
      value: data?.totalApps ?? "—",
      color: "#2563EB",
      sub: `${data?.inProgress ?? 0} בתהליך`,
    },
    {
      icon: Clock,
      label: "ראיונות מתוזמנים",
      value: data?.scheduledInterviews ?? "—",
      color: "#EA580C",
      sub: `${data?.completedInterviews ?? 0} הושלמו`,
    },
    { icon: CheckCircle, label: "גויסו", value: data?.hired ?? "—", color: "#059669" },
  ]

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A]">אנליטיקה</h1>
        <p className="text-[#64748B] font-semibold mt-1">סיכום פעילות גיוס לחברתך</p>
      </div>
      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E4ECFF] p-8 text-center">
        <BarChart3 className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-[#64748B] font-bold">גרפים מפורטים יהיו זמינים בקרוב</p>
        <p className="text-[#94A3B8] text-sm mt-1">נתוני הסטטיסטיקות מעודכנים בזמן אמת</p>
      </div>
    </div>
  )
}
