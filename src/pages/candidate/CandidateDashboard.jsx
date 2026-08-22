import { useState, useEffect } from "react"
import { applicationService } from "@/api/services/applicationService"
import { interviewService } from "@/api/services/interviewService"
import { savedJobService } from "@/api/services/savedJobService"
import { publicJobService } from "@/api/services/publicJobService"
import { useAuth } from "@/lib/AuthContext"
import { Zap, Target, BookOpen } from "lucide-react"

function StatCard({ icon: Icon, label, value, color = "#7C3AED", loading }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: color + "15" }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>

      <div>
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? (
            <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>

        <div className="text-sm font-semibold text-[#64748B]">{label}</div>
      </div>
    </div>
  )
}

export default function CandidateDashboard() {
  const { user } = useAuth()

  const [stats, setStats] = useState(null)

  const [recentJobs, setRecentJobs] = useState([])

  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) {
      return
    }

    setLoading(true)

    try {
      const [applications, interviews, savedJobs, jobs] = await Promise.all([
        applicationService.list({ limit: 500 }),
        interviewService.list({ status: "scheduled", limit: 500 }),
        savedJobService.list(),
        publicJobService.list({ is_closed: false, sort: "created_date", order: "DESC", limit: 5 }),
      ])

      setStats({
        applications: applications.length,
        interviews: interviews.length,
        savedJobs: savedJobs.length,
      })
      setRecentJobs(jobs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.email])

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">
            שלום, {user?.full_name?.split(" ")[0] || ""} 👋
          </h1>

          <p className="text-[#64748B] font-semibold mt-1">סיכום הפעילות וההתקדמות שלך</p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="h-9 w-9 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Zap}
          label="הגשות שלי"
          value={stats?.applications ?? "—"}
          color="#2563EB"
          loading={loading}
        />

        <StatCard
          icon={Target}
          label="ראיונות קרובים"
          value={stats?.interviews ?? "—"}
          color="#059669"
          loading={loading}
        />

        <StatCard
          icon={BookOpen}
          label="משרות שמורות"
          value={stats?.savedJobs ?? "—"}
          color="#EA580C"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-[#0F172A]">משרות אחרונות</h3>

            <Link
              to="/candidate/jobs/all"
              className="text-sm font-bold text-[#7C3AED] hover:underline"
            >
              כל המשרות
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <p className="text-[#94A3B8] text-sm text-center py-6">אין משרות זמינות כרגע</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#F0F1F5] hover:border-[#C4B5FD] transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F3EFFF] flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-[#7C3AED]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0F172A] truncate">{job.title}</div>

                    <div className="text-xs text-[#94A3B8] truncate">
                      {job.company} • {job.location}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <h3 className="text-lg font-black text-[#0F172A] mb-4">פעולות מהירות</h3>

          <div className="space-y-2">
            <Link
              to="/candidate/jobs/all"
              className="flex items-center gap-2 p-3 rounded-xl border border-[#E4ECFF] hover:border-[#C4B5FD] transition-colors text-sm font-bold text-[#374151]"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED]" /> חפש משרות
            </Link>

            <Link
              to="/candidate/profile"
              className="flex items-center gap-2 p-3 rounded-xl border border-[#E4ECFF] hover:border-[#C4B5FD] transition-colors text-sm font-bold text-[#374151]"
            >
              <Target className="w-4 h-4 text-[#2563EB]" /> עדכן פרופיל
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
import { Link } from "react-router-dom"
import { Sparkles, Briefcase, RefreshCw } from "lucide-react"
