/**
 * ImportDashboard — PHASE 5
 * Full Import → CRM → ATS → AI pipeline management
 * Includes: batch history, per-batch stats, retry, validation test
 */
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { candidateImportService } from "@/api/services/candidateImportService"
import { fileService } from "@/api/services/fileService"
import { useAuth } from "@/lib/AuthContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Users,
  FileText,
  Eye,
  Play,
  ChevronDown,
  ChevronUp,
  Download,
  XCircle,
  Info,
  FileScan,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import ResumeFileImporter from "@/components/admin/ResumeFileImporter"
import {
  PlatformCard,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
} from "@/components/platform/PlatformUI"

// ── 3 validation test candidates ─────────────────────────────────────────────
const TEST_CSV = `full_name,email,phone,role_name,domain_name,location,experience_years,skills,summary,resume_url
ישראל ישראלי,israel@test.com,0501234567,מפתח Full Stack,פיתוח תוכנה,תל אביב,5,React;Node.js;PostgreSQL,מפתח מנוסה עם ניסיון ב-SaaS,
שרה כהן,,0529876543,מנהלת מוצר,ניהול מוצר,הרצליה,8,Product Strategy;Agile;B2B,מנהלת מוצר ותיקה ללא אימייל,
ישראל ישראלי,israel@test.com,0501234567,מפתח Full Stack,פיתוח תוכנה,תל אביב,5,React;Node.js,כפילות מכוונת לבדיקה,`

const STATUS_CONFIG = {
  pending: { label: "ממתין", color: "bg-gray-100 text-gray-600", icon: Clock },
  processing: { label: "בתהליך", color: "bg-yellow-100 text-yellow-700", icon: RefreshCw },
  in_progress: { label: "בתהליך", color: "bg-yellow-100 text-yellow-700", icon: RefreshCw },
  completed: { label: "הושלם", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  partial: { label: "הושלם חלקית", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  failed: { label: "נכשל", color: "bg-red-100 text-red-700", icon: XCircle },
}

export default function ImportDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState("resume") // 'resume' | 'csv'
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null) // { type: 'success'|'error', text }
  const [expandedBatch, setExpandedBatch] = useState(null)
  const [runningValidation, setRunningValidation] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const showValidationTools = import.meta.env.DEV && user?.role === "admin"

  const { data: batches = [], refetch } = useQuery({
    queryKey: ["import-batches"],
    queryFn: () => candidateImportService.list({ sort: "created_date", order: "DESC", limit: 50 }),
    refetchInterval: (query) => {
      const data = query.state?.data
      const hasActive =
        Array.isArray(data) &&
        data.some((b) => ["pending", "processing", "in_progress"].includes(b.status))
      return hasActive ? 4000 : false
    },
  })

  // ── File upload & import ──────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadMsg({ type: "error", text: "CSV files only" })
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "File exceeds the 100MB limit" })
      return
    }
    setUploading(true)
    setUploadMsg(null)
    try {
      const { file_url } = await fileService.upload(file)
      const batch = await candidateImportService.create({
        batch_name: `${file.name.replace(/\.[^/.]+$/, "")} — ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}`,
        source_file: file_url,
        file_type: file.name.endsWith(".csv")
          ? "csv"
          : file.name.endsWith(".json")
            ? "json"
            : "xlsx",
        recruiter_id: user?.id,
        team_manager_id: user?.role === "team_manager" ? user.id : user?.team_manager_id,
        recruitment_manager_id: user?.recruitment_manager_id,
      })
      const queued = await candidateImportService.queueFileImport(batch.id, file_url, file.name)
      const d = await candidateImportService.waitForJob(queued.id)
      setUploadMsg({
        type: "success",
        text: `יובאו ${d.successful} מועמדים • ${d.duplicates} כפילויות • ${d.failed} כשלונות`,
      })
      setFile(null)
      document.getElementById("importFileInput").value = ""
      refetch()
    } catch (e) {
      setUploadMsg({ type: "error", text: e.message })
    } finally {
      setUploading(false)
    }
  }

  // ── Validation test with 3 test candidates ───────────────────────────────
  const runValidationTest = async () => {
    setRunningValidation(true)
    setValidationResult(null)
    try {
      const blob = new Blob([TEST_CSV], { type: "text/csv" })
      const testFile = new File([blob], "validation_test.csv", { type: "text/csv" })
      const { file_url } = await fileService.upload(testFile)
      const batch = await candidateImportService.create({
        batch_name: `Validation Test — ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}`,
        source_file: "validation_test.csv",
        file_type: "csv",
        recruiter_id: user?.id,
        team_manager_id: user?.role === "team_manager" ? user.id : user?.team_manager_id,
        recruitment_manager_id: user?.recruitment_manager_id,
      })
      const queued = await candidateImportService.queueFileImport(
        batch.id,
        file_url,
        "validation_test.csv",
      )
      const d = await candidateImportService.waitForJob(queued.id)
      setValidationResult({
        success: true,
        batch_id: batch.id,
        successful: d.successful,
        duplicates: d.duplicates,
        failed: d.failed,
        missingEmail: d.missingEmail,
        checks: [
          {
            label: "מועמד עם email + phone",
            pass: d.successful >= 1,
            note: `${d.successful} נקלטו`,
          },
          {
            label: "מועמד ללא email",
            pass: d.missingEmail >= 1,
            note: `${d.missingEmail} ללא אימייל`,
          },
          { label: "זיהוי כפילות", pass: d.duplicates >= 1, note: `${d.duplicates} כפילויות זוהו` },
        ],
      })
      refetch()
    } catch (e) {
      setValidationResult({ success: false, error: e.message })
    } finally {
      setRunningValidation(false)
    }
  }

  // ── Retry failed batch ────────────────────────────────────────────────────
  const retryBatch = async (batch) => {
    if (!batch.source_file) return
    setUploadMsg({ type: "success", text: `מנסה שוב batch: ${batch.batch_name}...` })
    try {
      const queued = await candidateImportService.retryBatch(batch.id)
      const result = await candidateImportService.waitForJob(queued.id)
      setUploadMsg({
        type: "success",
        text: `Retry completed: ${result.successful} succeeded • ${result.failed} failed • ${result.duplicates} duplicates`,
      })
      await refetch()
    } catch (error) {
      setUploadMsg({ type: "error", text: error?.message || "Retry failed" })
    }
  }

  const downloadErrorReport = (batch) => {
    const errors = Array.isArray(batch.error_log) ? batch.error_log : []
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`
    const csv = [
      "row_number,full_name,email,message",
      ...errors.map((error) =>
        [error.row_number, error.full_name, error.email, error.message].map(escape).join(","),
      ),
    ].join("\n")
    const link = document.createElement("a")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    link.href = url
    link.download = `import-errors-${batch.id}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── CSV template download ─────────────────────────────────────────────────
  const downloadTemplate = () => {
    const template =
      "full_name,email,phone,role_name,domain_name,location,experience_years,desired_salary_min,desired_salary_max,skills,languages,summary,resume_url,resume_filename,recruiter_id,employer_id,job_id\n"
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([template], { type: "text/csv" }))
    a.download = "candidates_import_template.csv"
    a.click()
  }

  const totalImported = batches.reduce((s, b) => s + (b.successful_imports || 0), 0)
  const totalDuplicates = batches.reduce((s, b) => s + (b.duplicate_found || 0), 0)
  const totalFailed = batches.reduce((s, b) => s + (b.failed_imports || 0), 0)
  const totalConversionFailed = batches.reduce((s, b) => s + (b.conversion_failures || 0), 0)
  const totalParsingFailed = batches.reduce((s, b) => s + (b.parsing_failures || 0), 0)

  return (
    <PlatformPageShell dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <PlatformPageHeader
          title="דשבורד ייבואים"
          subtitle="ייבוא מועמדים → CRM → ATS → AI Matching"
          icon={Upload}
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={downloadTemplate}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> הורד תבנית CSV
            </Button>
          }
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "אצוות", value: batches.length, tone: "violet", icon: FileText },
            { label: "יובאו", value: totalImported, tone: "emerald", icon: Users },
            { label: "כפילויות", value: totalDuplicates, tone: "amber", icon: Info },
            { label: "כשלונות", value: totalFailed, tone: "rose", icon: XCircle },
            { label: "המרה נכשלה", value: totalConversionFailed, tone: "amber", icon: RefreshCw },
            { label: "Parsing נכשל", value: totalParsingFailed, tone: "fuchsia", icon: FileScan },
          ].map((stat) => (
            <PlatformStatCard key={stat.label} {...stat} className="min-h-[118px] p-4" />
          ))}
        </div>

        {/* Import Tabs */}
        <PlatformCard className="overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-[#E4ECFF]">
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === "resume"
                  ? "border-[#7C3AED] text-[#7C3AED] bg-[#F3EFFF]"
                  : "border-transparent text-[#64748B] hover:text-[#7C3AED]"
              }`}
            >
              <FileScan className="w-4 h-4" />
              ייבוא קבצי קורות חיים
              <span className="text-xs bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                חדש
              </span>
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === "csv"
                  ? "border-[#7C3AED] text-[#7C3AED] bg-[#F3EFFF]"
                  : "border-transparent text-[#64748B] hover:text-[#7C3AED]"
              }`}
            >
              <FileText className="w-4 h-4" />
              ייבוא CSV
            </button>
          </div>

          <div className="p-6">
            {/* Resume file import tab */}
            {activeTab === "resume" && (
              <div>
                <p className="text-sm text-[#64748B] mb-4 font-semibold">
                  העלה קבצי PDF, DOC או DOCX — המערכת תמיר ל-DOCX, תנתח אוטומטית ותיצור מועמד ב-CRM
                </p>
                <ResumeFileImporter onImportComplete={() => refetch()} />
              </div>
            )}

            {/* CSV import tab */}
            {activeTab === "csv" && (
              <div>
                <p className="text-sm text-[#64748B] mb-4 font-semibold">
                  ייבא מועמדים מקובץ CSV עם עמודות מוגדרות
                </p>
                <div
                  className="border-2 border-dashed border-[#E4ECFF] rounded-xl p-8 text-center hover:border-[#7C3AED] transition-colors cursor-pointer"
                  onClick={() => document.getElementById("importFileInput").click()}
                >
                  <Upload className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                  <p className="font-bold text-[#374151]">
                    {file ? file.name : "גרור קובץ CSV כאן או לחץ להעלאה"}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    CSV בלבד • עמודות: full_name, email, phone, role_name, skills...
                  </p>
                  <input
                    id="importFileInput"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null)
                      setUploadMsg(null)
                    }}
                  />
                </div>

                {uploadMsg && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${uploadMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {uploadMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {uploadMsg.text}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                        מייבא...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 ml-2" />
                        ייבא מועמדים
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PlatformCard>

        {/* Validation Test */}
        {showValidationTools && (
          <PlatformCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-black text-[#0F172A]">בדיקת אימות</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  מריץ 3 מועמדי בדיקה: עם email+phone, ללא email, כפילות
                </p>
              </div>
              <Button
                size="sm"
                onClick={runValidationTest}
                disabled={runningValidation}
                className="bg-[#F3EFFF] text-[#7C3AED] hover:bg-[#E9E3FF] border border-[#C4B5FD] gap-1.5"
              >
                {runningValidation ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {runningValidation ? "רץ..." : "הרץ בדיקה"}
              </Button>
            </div>

            {validationResult && (
              <div
                className={`rounded-xl p-4 ${validationResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                {validationResult.success ? (
                  <div className="space-y-2">
                    {validationResult.checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {c.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm font-semibold ${c.pass ? "text-green-800" : "text-red-700"}`}
                        >
                          {c.label}
                        </span>
                        <span className="text-xs text-[#64748B] mr-auto">{c.note}</span>
                      </div>
                    ))}
                    <div className="text-xs text-[#64748B] pt-2 border-t border-green-200 mt-2">
                      Batch ID: {validationResult.batch_id}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700 font-semibold">
                    שגיאה: {validationResult.error}
                  </p>
                )}
              </div>
            )}
          </PlatformCard>
        )}

        {/* Batch History */}
        <PlatformCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-[#0F172A]">היסטוריית אצוות</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> רענן
            </Button>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">אין batches עדיין</p>
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => {
                const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.pending
                const StatusIcon = cfg.icon
                const isExpanded = expandedBatch === batch.id

                return (
                  <div
                    key={batch.id}
                    className="border border-[#E4ECFF] rounded-xl overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F7F8FC] transition-colors"
                      onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                    >
                      <StatusIcon
                        className={`w-4 h-4 flex-shrink-0 ${batch.status === "in_progress" ? "animate-spin" : ""}`}
                        style={{
                          color: cfg.color.includes("green")
                            ? "#10B981"
                            : cfg.color.includes("yellow")
                              ? "#F59E0B"
                              : cfg.color.includes("red")
                                ? "#EF4444"
                                : "#64748B",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#0F172A] truncate">
                          {batch.batch_name}
                        </div>
                        <div className="text-xs text-[#94A3B8]">
                          {batch.created_date
                            ? format(new Date(batch.created_date), "dd/MM/yyyy HH:mm", {
                                locale: he,
                              })
                            : ""}{" "}
                          • {batch.source_file}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {(batch.status === "failed" ||
                          (batch.status === "partial" && batch.failed_imports > 0)) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              retryBatch(batch)
                            }}
                            className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> retry
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#F0F1F5] bg-[#F7F8FC]">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4">
                          {[
                            {
                              label: "נקלטו",
                              value: batch.successful_imports || 0,
                              color: "#10B981",
                            },
                            {
                              label: "כשלונות",
                              value: batch.failed_imports || 0,
                              color: "#EF4444",
                            },
                            {
                              label: "כפילויות",
                              value: batch.duplicate_found || 0,
                              color: "#F59E0B",
                            },
                            {
                              label: "המרה נכשלה",
                              value: batch.conversion_failures || 0,
                              color: "#F97316",
                            },
                            {
                              label: "Parsing נכשל",
                              value: batch.parsing_failures || 0,
                              color: "#8B5CF6",
                            },
                            { label: "ללא CV", value: batch.missing_resume || 0, color: "#64748B" },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="text-center bg-white rounded-xl p-3 border border-[#E4ECFF]"
                            >
                              <div className="text-xl font-black" style={{ color: stat.color }}>
                                {stat.value}
                              </div>
                              <div className="text-xs text-[#94A3B8] font-semibold mt-0.5">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                        {Array.isArray(batch.error_log) && batch.error_log.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-xs font-bold text-red-700 mb-1">שגיאות:</p>
                            <pre className="text-xs text-red-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {JSON.stringify(batch.error_log, null, 2)}
                            </pre>
                            <button
                              onClick={() => downloadErrorReport(batch)}
                              className="mt-2 flex items-center gap-1 text-xs font-bold text-red-700 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Download error report
                            </button>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `${location.pathname.startsWith("/agency/team/") ? "/agency/team/crm" : "/agency/crm"}?importBatchId=${batch.id}`,
                              )
                            }
                            className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> צפה במועמדים ב-CRM
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}
