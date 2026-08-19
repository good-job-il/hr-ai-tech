import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { applicationService } from "@/api/services/applicationService"

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-purple-100 text-purple-700",
  phone_interview: "bg-yellow-100 text-yellow-700",
  recommended: "bg-green-100 text-green-700",
  employer_interview: "bg-indigo-100 text-indigo-700",
  offer: "bg-emerald-100 text-emerald-700",
  hired: "bg-teal-100 text-teal-700",
  probation: "bg-cyan-100 text-cyan-700",
  completed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
}

export default function AdminManageCandidates() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")

  const [filterStatus, setFilterStatus] = useState("all")

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-all-applications"],
    queryFn: () => applicationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => applicationService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-applications"] }),
  })

  const statuses = Array.from(new Set(applications.map((a) => a.status)))

  const filtered = applications.filter((a) => {
    const matchSearch =
      !search ||
      a.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.candidate_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.company?.toLowerCase().includes(search.toLowerCase()) ||
      a.job_title?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === "all" || a.status === filterStatus

    return matchSearch && matchStatus
  })

  const stats = {
    total: applications.length,
    new: applications.filter((a) => a.status === "new").length,
    hired: applications.filter((a) => a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ניהול מועמדים</h1>
          <p className="text-sm text-gray-500 mt-1">כל המועמדויות לכל החברות</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">סה"כ</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-xs text-gray-500 mt-1">חדשה</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-green-600">{stats.hired}</div>
            <div className="text-xs text-gray-500 mt-1">נשכרו</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center">
            <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500 mt-1">נדחו</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם / אימייל / חברה / משרה..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "new"
                  ? "חדשה"
                  : s === "reviewed"
                    ? "נבדקה"
                    : s === "phone_interview"
                      ? "ראיון טלפוני"
                      : s === "recommended"
                        ? "מומלצת"
                        : s === "employer_interview"
                          ? "ראיון עם מעסיק"
                          : s === "offer"
                            ? "הצעה"
                            : s === "hired"
                              ? "נשכרה"
                              : s === "probation"
                                ? "תקופת ניסיון"
                                : s === "completed"
                                  ? "הסתיימה"
                                  : s === "rejected"
                                    ? "נדחית"
                                    : s}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {app.candidate_name}
                      </div>
                      <div className="text-xs text-gray-500">{app.candidate_email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{app.job_title}</span>
                    <span>·</span>
                    <span>{app.company}</span>
                    <span>·</span>
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${STATUS_COLORS[app.status] || STATUS_COLORS.new}`}
                    >
                      {app.status === "new"
                        ? "חדשה"
                        : app.status === "reviewed"
                          ? "נבדקה"
                          : app.status === "phone_interview"
                            ? "ראיון טלפוני"
                            : app.status === "recommended"
                              ? "מומלצת"
                              : app.status === "employer_interview"
                                ? "ראיון עם מעסיק"
                                : app.status === "offer"
                                  ? "הצעה"
                                  : app.status === "hired"
                                    ? "נשכרה"
                                    : app.status === "probation"
                                      ? "תקופת ניסיון"
                                      : app.status === "completed"
                                        ? "הסתיימה"
                                        : app.status === "rejected"
                                          ? "נדחית"
                                          : app.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mr-4">
                  {app.resume_url && (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(app.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">לא נמצאו מועמדויות</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
