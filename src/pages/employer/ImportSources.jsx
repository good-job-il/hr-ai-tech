import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { importSourceService } from "@/api/services/importSourceService"
import { jobService } from "@/api/services/jobService"

export default function ImportSources() {
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)

  const [editingSource, setEditingSource] = useState(null)

  const [showLogs, setShowLogs] = useState(null)

  const [search, setSearch] = useState("")

  const [quickUrl, setQuickUrl] = useState("")

  const [quickName, setQuickName] = useState("")

  const [quickScanning, setQuickScanning] = useState(false)

  const [quickResult, setQuickResult] = useState(null)

  const [scanResults, setScanResults] = useState({})

  const [scanning, setScanning] = useState({})

  const [expandedLogs, setExpandedLogs] = useState({})

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["import-sources"],
    queryFn: () => importSourceService.list({ limit: 50 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => importSourceService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["import-sources"] }),
  })

  const syncMutation = useMutation({
    mutationFn: (source) => importSourceService.run(source.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["import-sources"] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ["import-sources"] }),
  })

  const scanSource = async (source) => {
    setScanning((prev) => ({ ...prev, [source.id]: true }))
    setScanResults((prev) => ({ ...prev, [source.id]: null }))

    try {
      const result = await importSourceService.run(source.id)

      setScanResults((prev) => ({ ...prev, [source.id]: result }))
    } catch (err) {
      setScanResults((prev) => ({ ...prev, [source.id]: { success: false, error: err.message } }))
    } finally {
      setScanning((prev) => ({ ...prev, [source.id]: false }))
      queryClient.invalidateQueries({ queryKey: ["import-sources"] })
    }
  }

  const quickScan = async () => {
    if (!quickUrl) {
      return
    }

    setQuickScanning(true)
    setQuickResult(null)

    try {
      const result = await importSourceService.preview(quickUrl, quickName || "חברה")

      setQuickResult(result)
    } catch (err) {
      setQuickResult({ success: false, error: err.message })
    } finally {
      setQuickScanning(false)
    }
  }

  const { data: activeJobsCount = 0 } = useQuery({
    queryKey: ["active-jobs-count"],
    queryFn: async () => {
      const jobs = await jobService.list({ is_closed: false, limit: 500 })

      return jobs.length
    },
  })

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const activeSources = sources.filter((s) => s.is_active)

      const results = await Promise.allSettled(
        activeSources.map((source) => importSourceService.run(source.id)),
      )

      const errors = results.filter((r) => r.status === "rejected")

      if (errors.length > 0) {
        throw new Error(`${errors.length} מקורות נכשלו. בדוק את הלוגים`)
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-sources"] })
      queryClient.invalidateQueries({ queryKey: ["active-jobs-count"] })
    },
  })

  const statusIcon = (source) => {
    if (scanning[source.id]) {
      return <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
    }

    if (source.last_sync_status === "success") {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    }

    if (source.last_sync_status === "error") {
      return <XCircle className="w-3.5 h-3.5 text-red-500" />
    }

    return <Clock className="w-3.5 h-3.5 text-gray-400" />
  }

  const ScanResultPanel = ({ result, onClose }) => {
    const [showLog, setShowLog] = useState(false)

    const [showErrors, setShowErrors] = useState(false)

    if (!result) {
      return null
    }

    return (
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-800 flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            תוצאות סריקה
          </span>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">
            סגור
          </button>
        </div>

        {result.summary && (
          <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3 text-gray-700 font-medium">
            {result.summary}
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {[
            { label: "עמודים", value: result.pages_scanned, color: "text-blue-600" },
            { label: "קישורים", value: result.job_links_found, color: "text-purple-600" },
            { label: "חדשות", value: result.created, color: "text-green-600" },
            { label: "עודכנו", value: result.updated, color: "text-cyan-600" },
            { label: "נסגרו", value: result.closed, color: "text-orange-500" },
            { label: "שגיאות", value: result.errors_count, color: "text-red-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-100 rounded-lg p-2 text-center"
            >
              <div className={`text-lg font-bold ${s.color}`}>{s.value ?? 0}</div>

              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {result.errors?.length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="flex items-center gap-1 text-xs text-red-500 font-medium"
            >
              <AlertTriangle className="w-3 h-3" />
              {result.errors.length} שגיאות{" "}
              {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showErrors && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    className="text-xs bg-red-50 border border-red-100 rounded p-2 text-red-700"
                  >
                    <span className="font-medium">{e.error}</span>

                    {e.url && <span className="text-red-400 mr-2 truncate block">{e.url}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result.log?.length > 0 && (
          <div>
            <button
              onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-1 text-xs text-gray-500 font-medium"
            >
              <FileText className="w-3 h-3" />
              לוג מפורט{" "}
              {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showLog && (
              <pre className="mt-2 text-xs bg-gray-900 text-green-400 rounded-lg p-3 overflow-auto max-h-56 whitespace-pre-wrap font-mono">
                {result.log.join("\n")}
              </pre>
            )}
          </div>
        )}

        {result.error && !result.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs">
            <AlertTriangle className="w-4 h-4 inline ml-1" />

            {result.error}
          </div>
        )}
      </div>
    )
  }

  const totalActive = sources.filter((s) => s.is_active).length

  const totalErrors = sources.filter((s) => s.last_sync_status === "error").length

  const totalNew = sources.reduce((sum, s) => sum + (s.jobs_added || 0), 0)

  const filteredSources = search
    ? sources.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.url?.toLowerCase().includes(search.toLowerCase()),
      )
    : sources

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מנוע ייבוא משרות</h1>

            <p className="text-sm text-gray-500 mt-1">
              סריקה אוטומטית + ניהול מקורות - הזן URL אחד, המערכת מגלה את כל המשרות
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending || sources.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />

              {syncAllMutation.isPending ? "מייבא..." : "ייבא הכל"}
            </button>

            <button
              onClick={() => {
                setEditingSource(null)
                setShowModal(true)
              }}
              className="bg-hhblue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> הוסף מקור
            </button>
          </div>
        </div>

        {/* Quick Scan */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-purple-800 mb-1 flex items-center gap-2">
            <Search className="w-4 h-4" /> סריקה מהירה — בלי להוסיף מקור
          </h2>

          <p className="text-xs text-purple-600 mb-4">הכנס URL לבדיקה חד-פעמית ללא שמירה</p>

          <div className="flex gap-2 flex-wrap">
            <input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="שם חברה (פנימי)"
              className="border border-purple-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400/30 bg-white text-gray-900 w-44"
            />

            <input
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="https://careers.company.com"
              dir="ltr"
              className="border border-purple-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-400/30 bg-white text-gray-900 flex-1 min-w-56 text-left"
            />

            <button
              onClick={quickScan}
              disabled={!quickUrl || quickScanning}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {quickScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}

              {quickScanning ? "סורק..." : "סרוק עכשיו"}
            </button>
          </div>

          {quickScanning && (
            <div className="mt-4 bg-white/60 rounded-xl p-4 text-sm text-purple-700 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500 shrink-0" />

              <div>
                <div className="font-semibold">סורק את עמוד הקריירה...</div>

                <div className="text-xs text-purple-500 mt-0.5">
                  המערכת מזהה משרות, עוברת בין עמודים ומחלצת תוכן מלא. זה עשוי לקחת מספר דקות.
                </div>
              </div>
            </div>
          )}

          {quickResult && (
            <ScanResultPanel result={quickResult} onClose={() => setQuickResult(null)} />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "משרות פעילות", value: activeJobsCount, color: "text-emerald-600" },
            { label: "משרות חדשות", value: totalNew, color: "text-purple-600" },
            { label: "מקורות פעילים", value: totalActive, color: "text-green-600" },
            { label: 'סה"כ מקורות', value: sources.length, color: "text-purple-600" },
            { label: "שגיאות", value: totalErrors, color: "text-red-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>

              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם חברה או URL..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-purple-400/30 bg-white text-gray-900"
          />

          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
          </div>
        ) : sources.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500 mb-4">אין מקורות ייבוא עדיין</p>

            <button
              onClick={() => {
                setEditingSource(null)
                setShowModal(true)
              }}
              className="bg-hhblue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90"
            >
              הוסף מקור ראשון
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-4 flex items-center gap-3 flex-wrap">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${source.is_active ? "bg-green-500" : "bg-gray-300"}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{source.name}</span>

                      {source.provider && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {source.provider}
                        </span>
                      )}

                      {!source.is_active && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          כבוי
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-sm" dir="ltr">
                      {source.url}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {statusIcon(source)}

                        {scanning[source.id]
                          ? "סורק..."
                          : source.last_sync
                            ? new Date(source.last_sync).toLocaleString("he-IL", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "לא סונכרן"}
                      </span>

                      <span className="text-xs font-medium text-green-600">
                        +{source.jobs_added || 0} חדשות
                      </span>

                      <span className="text-xs text-cyan-600">
                        ~{source.jobs_updated || 0} עודכנו
                      </span>

                      <span className="text-xs text-orange-500">
                        {source.jobs_closed || 0} נסגרו
                      </span>

                      {source.interval_hours > 0 && (
                        <span className="text-xs text-gray-400">כל {source.interval_hours}ש׳</span>
                      )}
                    </div>

                    {source.last_sync_status === "error" && source.last_error && (
                      <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
                        <AlertTriangle className="w-3 h-3" /> {source.last_error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {source.logs && (
                      <button
                        onClick={() => setShowLogs(showLogs === source.id ? null : source.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                        title="לוג"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                      title="פתח מקור"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => {
                        setEditingSource(source)
                        setShowModal(true)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      title="עריכה"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => scanSource(source)}
                      disabled={scanning[source.id]}
                      className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {scanning[source.id] ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> סורק...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> סרוק
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => deleteMutation.mutate(source.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Logs panel */}
                {showLogs === source.id && source.logs && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <pre className="text-xs text-gray-600 bg-white rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap border border-gray-100">
                      {source.logs}
                    </pre>
                  </div>
                )}

                {/* Scan results */}
                {scanResults[source.id] && (
                  <div className="border-t border-gray-100 p-4">
                    <ScanResultPanel
                      result={scanResults[source.id]}
                      onClose={() => setScanResults((p) => ({ ...p, [source.id]: null }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ImportSourceModal
          source={editingSource}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ["import-sources"] })
          }}
        />
      )}
    </AdminLayout>
  )
}
