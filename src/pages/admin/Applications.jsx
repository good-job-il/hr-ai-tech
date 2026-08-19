import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { applicationService } from "@/api/services/applicationService"

const statusLabels = {
  new: "חדש",
  reviewed: "בבדיקה",
  phone_interview: "ראיון טלפוני",
  recommended: "הומלץ",
  employer_interview: "ראיון בחברה",
  offer: "הצעה",
  hired: "התקבל",
  probation: "אחריות",
  completed: "הושלם",
  rejected: "דחוי",
}

const statusColors = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-cyan-100 text-cyan-700",
  phone_interview: "bg-indigo-100 text-indigo-700",
  recommended: "bg-purple-100 text-purple-700",
  employer_interview: "bg-violet-100 text-violet-700",
  offer: "bg-green-100 text-green-700",
  hired: "bg-emerald-100 text-emerald-700",
  probation: "bg-teal-100 text-teal-700",
  completed: "bg-lime-100 text-lime-700",
  rejected: "bg-red-100 text-red-700",
}

const sourceLabels = {
  app: "אתר",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  jobsite: "אתר דרושים",
  other: "אחר",
}

export default function AdminApplications() {
  const [search, setSearch] = useState("")

  const [filterStatus, setFilterStatus] = useState("")

  const [filterSource, setFilterSource] = useState("")

  const [filterEmployer, setFilterEmployer] = useState("")

  const [dateFrom, setDateFrom] = useState("")

  const [dateTo, setDateTo] = useState("")

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-all-applications"],
    queryFn: () => applicationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
  })

  // Unique employers for filter
  const employers = [...new Set(applications.map((a) => a.employer_id).filter(Boolean))]

  const filtered = applications.filter((app) => {
    const searchLower = search.toLowerCase()

    const matchSearch =
      !search ||
      app.candidate_name?.toLowerCase().includes(searchLower) ||
      app.candidate_email?.toLowerCase().includes(searchLower) ||
      app.job_title?.toLowerCase().includes(searchLower) ||
      app.company?.toLowerCase().includes(searchLower)

    const matchStatus = !filterStatus || app.status === filterStatus

    const matchSource = !filterSource || app.source === filterSource

    const matchEmployer = !filterEmployer || app.employer_id === filterEmployer

    const matchDateFrom = !dateFrom || new Date(app.created_date) >= new Date(dateFrom)

    const matchDateTo = !dateTo || new Date(app.created_date) <= new Date(dateTo + "T23:59:59")

    return (
      matchSearch && matchStatus && matchSource && matchEmployer && matchDateFrom && matchDateTo
    )
  })

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">כל המועמדויות</h1>

          <p className="text-sm text-gray-500 mt-1">{filtered.length} מועמדויות</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-900">{applications.length}</div>

            <div className="text-xs text-gray-500">סה"כ</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-blue-600">
              {applications.filter((a) => a.status === "new").length}
            </div>

            <div className="text-xs text-gray-500">חדשות</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-emerald-600">
              {applications.filter((a) => a.status === "hired").length}
            </div>

            <div className="text-xs text-gray-500">התקבלו</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-red-500">
              {applications.filter((a) => a.status === "rejected").length}
            </div>

            <div className="text-xs text-gray-500">נדחו</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי מועמד, משרה, חברה..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="">כל הסטטוסים</option>

            {Object.entries(statusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="">כל המקורות</option>

            {Object.entries(sourceLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={filterEmployer}
            onChange={(e) => setFilterEmployer(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none max-w-[180px]"
          >
            <option value="">כל המעסיקים</option>

            {employers.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            placeholder="מתאריך"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
            placeholder="עד תאריך"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">לא נמצאו מועמדויות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-right">
                  <th className="px-3 py-2 font-semibold rounded-r-lg">מועמד</th>

                  <th className="px-3 py-2 font-semibold">משרה</th>

                  <th className="px-3 py-2 font-semibold">מעסיק</th>

                  <th className="px-3 py-2 font-semibold">ציפיות שכר</th>

                  <th className="px-3 py-2 font-semibold">סטטוס</th>

                  <th className="px-3 py-2 font-semibold">מקור</th>

                  <th className="px-3 py-2 font-semibold">תאריך</th>

                  <th className="px-3 py-2 font-semibold rounded-l-lg">קו"ח</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-gray-900">{app.candidate_name}</div>

                      <div className="text-xs text-gray-500">{app.candidate_email}</div>

                      {app.candidate_phone && (
                        <div className="text-xs text-gray-400">{app.candidate_phone}</div>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800">{app.job_title || "—"}</div>

                      <div className="text-xs text-gray-500">{app.company || "—"}</div>
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-600">
                      {app.employer_id ? (
                        <span>{app.employer_id}</span>
                      ) : (
                        <span className="text-orange-500 font-medium">ללא מעסיק משויך</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-600">
                      {app.desired_salary_min || app.desired_salary_max ? (
                        <span>
                          ₪{app.desired_salary_min?.toLocaleString() || "?"} – ₪
                          {app.desired_salary_max?.toLocaleString() || "?"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[app.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {statusLabels[app.status] || app.status}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-500">
                      {sourceLabels[app.source] || app.source || "—"}
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(app.created_date).toLocaleDateString("he-IL")}
                    </td>

                    <td className="px-3 py-3">
                      {app.resume_url ? (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-hhblue hover:underline text-xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> פתח
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
