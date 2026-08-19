import { useState, useEffect } from "react"
import { analyticsService } from "@/api/services/analyticsService"
import {
  Users,
  Building2,
  Briefcase,
  Activity,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Zap,
  ArrowUpRight,
  UserPlus,
  Shield,
  Database,
} from "lucide-react"

// ── Stat Card with % change ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, change, color = "#7C3AED", loading }) {
  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "15" }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2">
            <div className="w-16 h-7 bg-gray-100 rounded animate-pulse" />
            <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-black text-[#0F172A]">
              {value?.toLocaleString() ?? "—"}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-[#64748B]">{label}</span>
              {change !== undefined && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(change)}%<span className="text-[#94A3B8] font-normal">משבוע</span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── System Health Row ────────────────────────────────────────────────────────
function HealthRow({ label, status, loading }) {
  const statusMap = {
    active: { dot: "bg-emerald-500", text: "פעיל", color: "text-emerald-600" },
    warning: { dot: "bg-amber-500", text: "אזהרה", color: "text-amber-600" },
    inactive: { dot: "bg-gray-400", text: "לא פעיל", color: "text-gray-500" },
    error: { dot: "bg-red-500", text: "שגיאה", color: "text-red-600" },
    ok: { dot: "bg-emerald-500", text: "תקין", color: "text-emerald-600" },
    pending: { dot: "bg-amber-500", text: "בתהליך", color: "text-amber-600" },
  }

  const s = statusMap[status] || statusMap.inactive

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-sm font-semibold text-[#374151]">{label}</span>
      {loading ? (
        <div className="w-14 h-4 bg-gray-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className={`text-xs font-bold ${s.color}`}>{s.text}</span>
        </div>
      )}
    </div>
  )
}

const IMPORT_SOURCE_COLORS = ["#8B5CF6", "#6366F1", "#3B82F6", "#06B6D4", "#10B981"]

const ICON_MAP = {
  UserPlus,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Zap,
  Shield,
  Database,
  Calendar: Clock,
  MessageSquare: FileText,
  Send: ArrowUpRight,
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [lastUpdated, setLastUpdated] = useState(null)

  const [chartView, setChartView] = useState("candidates")

  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await analyticsService.dashboard()

      setStats(res.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error("AdminDashboard stats error:", e)
      setError("לא ניתן לטעון נתוני דשבורד. בדוק חיבור לשרת.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const importSourceData = stats?.importSourceData || []

  const recentImports = stats?.recentImports || []

  const recentActivity = (stats?.recentActivity || []).map((a) => ({
    ...a,
    icon: ICON_MAP[a.icon] || Activity,
  }))

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0F172A]">דשבורד ראשי</h1>
            <span className="text-xs bg-[#F3EFFF] text-[#7C3AED] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> סקירה כללית של פעילות המערכת
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-0.5">
            {new Date().toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {lastUpdated && (
              <span className="mr-3 text-xs text-[#94A3B8]">
                עודכן: {lastUpdated.toLocaleTimeString("he-IL")}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] bg-[#F3EFFF] px-4 py-2 rounded-xl hover:bg-[#EDE8FF] disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> רענן
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="ייבואים (סה״כ אצוות)"
          value={stats?.batchCount}
          color="#F59E0B"
          loading={loading}
        />
        <StatCard
          icon={Briefcase}
          label="משרות פתוחות"
          value={stats?.openJobs}
          color="#3B82F6"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="מועמדים במערכת"
          value={stats?.candidates}
          color="#8B5CF6"
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="חברות רשומות"
          value={stats?.companies}
          color="#6366F1"
          loading={loading}
        />
      </div>

      {/* Chart + Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7C3AED]" />
              גרף השתנות
            </h3>
            <div className="flex items-center gap-1 bg-[#F7FBFF] rounded-xl p-1 border border-[#E4ECFF]">
              {[
                { key: "candidates", label: "מועמדים" },
                { key: "jobs", label: "משרות" },
                { key: "companies", label: "חברות" },
                { key: "imports", label: "ייבואים" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartView(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === opt.key ? "bg-white text-[#7C3AED] shadow-sm" : "text-[#94A3B8] hover:text-[#64748B]"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {stats?.trendData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E4ECFF", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey={chartView}
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ fill: "#8B5CF6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-[#94A3B8] gap-2">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <span className="text-sm font-semibold">אין נתוני מגמה להצגה</span>
            </div>
          )}
        </div>

        {/* Pie: import sources */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <h3 className="text-base font-black text-[#0F172A] mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#7C3AED]" />
            מקורות יבוא מועמדים
          </h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RePieChart>
                <Pie
                  data={importSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {importSourceData.map((_, i) => (
                    <Cell key={i} fill={IMPORT_SOURCE_COLORS[i % IMPORT_SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${v}%`}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-2">
              {importSourceData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: IMPORT_SOURCE_COLORS[i] }}
                    />
                    <span className="text-[#374151] font-semibold">{item.name}</span>
                  </div>
                  <span className="font-black text-[#0F172A]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent imports */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#7C3AED]" /> ייבוא אחרונים
            </h3>
            <Link
              to="/admin/import-dashboard"
              className="text-xs font-bold text-[#7C3AED] hover:underline"
            >
              הצג הכל
            </Link>
          </div>
          <div className="space-y-3">
            {recentImports.length === 0 && !loading ? (
              <div className="text-center py-6 text-[#94A3B8] text-sm font-semibold">
                אין ייבואים אחרונים
              </div>
            ) : (
              recentImports.map((imp, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F3EFFF] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#0F172A] truncate">{imp.name}</div>
                    <div className="text-[11px] text-[#64748B] truncate">{imp.company}</div>
                    <div className="text-[11px] text-[#94A3B8]">{imp.date}</div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                    {imp.count} רשומות
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" /> פעילות אחרונה במערכת
            </h3>
            <Link
              to="/admin/analytics/behavior"
              className="text-xs font-bold text-[#7C3AED] hover:underline"
            >
              הצג הכל
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 && !loading ? (
              <div className="text-center py-6 text-[#94A3B8] text-sm font-semibold">
                אין פעילות אחרונה
              </div>
            ) : (
              recentActivity.map((item, i) => {
                const Icon = item.icon

                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0F172A]">{item.text}</div>
                      <div className="text-[11px] text-[#64748B] truncate">{item.sub}</div>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] flex-shrink-0 mt-0.5">
                      {item.time}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7C3AED]" /> בריאות המערכת והרשאות
            </h3>
          </div>
          <div>
            <HealthRow label="מגייסים" status="active" loading={loading} />
            <HealthRow label="מנהלי צוות" status="active" loading={loading} />
            <HealthRow
              label="ספק נתונים AI"
              status={stats?.pendingBatches > 0 ? "warning" : "ok"}
              loading={loading}
            />
            <HealthRow label="אדמין" status="active" loading={loading} />
            <HealthRow
              label="מעסיקים"
              status={stats?.openJobs > 0 ? "active" : "warning"}
              loading={loading}
            />
          </div>

          {/* Action Required inline */}
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-2">
            <div className="text-xs font-black text-[#374151] flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> פעולות נדרשות
            </div>
            {(stats?.reviewRequired ?? 0) > 0 && (
              <Link
                to="/admin/crm"
                className="block p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <div className="text-xs font-black text-amber-700">
                  {stats.reviewRequired} מועמדים דורשים בדיקה
                </div>
                <div className="text-[10px] text-amber-600">לחץ לצפייה ב-CRM</div>
              </Link>
            )}
            {(stats?.openJobs ?? 0) === 0 && (
              <Link
                to="/admin/jobs"
                className="block p-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <div className="text-xs font-black text-red-700">אין משרות פתוחות!</div>
                <div className="text-[10px] text-red-600">לחץ לניהול משרות</div>
              </Link>
            )}
            {(stats?.reviewRequired ?? 0) === 0 && (stats?.openJobs ?? 0) > 0 && (
              <div className="p-2.5 rounded-xl bg-green-50 border border-green-200">
                <div className="text-xs font-black text-green-700">הכל תקין! 🎉</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {[
          {
            icon: AlertCircle,
            label: "כשלי ייבוא (סה״כ)",
            value: stats?.failedImports != null ? String(stats.failedImports) : "—",
            color: "#F59E0B",
          },
          {
            icon: FileText,
            label: "רשומות יובאו בהצלחה",
            value: stats?.totalImported != null ? String(stats.totalImported) : "—",
            color: "#6366F1",
          },
          {
            icon: CheckCircle2,
            label: "הגשות חדשות",
            value: stats?.newApplications != null ? String(stats.newApplications) : "—",
            color: "#10B981",
          },
          {
            icon: Activity,
            label: "ראיונות מתוזמנים",
            value: stats?.scheduledInterviews != null ? String(stats.scheduledInterviews) : "—",
            color: "#3B82F6",
          },
          {
            icon: Clock,
            label: "אצוות בתהליך",
            value: stats?.pendingBatches != null ? String(stats.pendingBatches) : "—",
            color: "#0891B2",
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-[#E4ECFF] p-3 flex flex-col items-center text-center gap-1"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: item.color + "15" }}
              >
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="text-base font-black text-[#0F172A]">{item.value}</div>
              <div className="text-[10px] text-[#94A3B8] font-semibold leading-tight">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
