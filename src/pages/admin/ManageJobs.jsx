import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobService } from "@/api/services/jobService"

const SOURCE_LABELS = {
  novolog_import: "נובולוג",
  shafir_import: "שפיר",
  elbit_import: "אלביט",
  alljobs_import: "AllJobs",
}

export default function AdminManageJobs() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")

  const [filterSource, setFilterSource] = useState("all")

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-all-jobs"],
    queryFn: () => jobService.list({ sort: "created_date", order: "DESC", limit: 200 }),
  })

  const toggleCloseMutation = useMutation({
    mutationFn: (job) => jobService.update(job.id, { is_closed: !job.is_closed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => jobService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] }),
  })

  const importSources = [...new Set(jobs.map((j) => j.employer_id).filter(Boolean))]

  const filtered = jobs.filter((j) => {
    const matchSearch = !search || j.title?.includes(search) || j.company?.includes(search)

    const matchSource = filterSource === "all" || j.employer_id === filterSource

    return matchSearch && matchSource
  })

  const activeCount = filtered.filter((j) => !j.is_closed).length

  const closedCount = filtered.filter((j) => j.is_closed).length

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ניהול משרות</h1>

          <p className="text-sm text-gray-500 mt-1">כל המשרות במערכת</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-900">{jobs.length}</div>

            <div className="text-xs text-gray-500">סה"כ</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-green-600">{activeCount}</div>

            <div className="text-xs text-gray-500">פעילות</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-400">{closedCount}</div>

            <div className="text-xs text-gray-500">סגורות</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת / חברה..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 bg-white text-gray-900"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white text-gray-900"
          >
            <option value="all">כל המקורות</option>

            {importSources.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s] || s}
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
            {filtered.map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-xl border shadow-sm p-3 flex items-center justify-between ${job.is_closed ? "opacity-60 border-gray-100" : "border-gray-100"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: job.company_color || "#3da8c8" }}
                  >
                    {job.company_initials || job.company?.slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{job.title}</div>

                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{job.company}</span>

                      <span>·</span>

                      <span>{job.location}</span>

                      {job.employer_id && SOURCE_LABELS[job.employer_id] && (
                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                          {SOURCE_LABELS[job.employer_id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${job.is_closed ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}
                  >
                    {job.is_closed ? "סגורה" : "פעילה"}
                  </span>

                  <button
                    onClick={() => toggleCloseMutation.mutate(job)}
                    title={job.is_closed ? "פתח משרה" : "סגור משרה"}
                    className={`p-2 rounded-lg transition-all font-medium text-sm ${job.is_closed ? "hover:bg-green-50 text-gray-400 hover:text-green-600" : "hover:bg-orange-50 text-gray-400 hover:text-orange-600"} active:scale-90`}
                  >
                    {job.is_closed ? (
                      <ToggleLeft className="w-4 h-4" />
                    ) : (
                      <ToggleRight className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteMutation.mutate(job.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">לא נמצאו משרות</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
import { ToggleLeft, ToggleRight, Trash2, Search } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
