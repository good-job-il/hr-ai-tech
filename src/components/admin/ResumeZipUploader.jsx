import { useState } from "react"
import { candidateImportService } from "@/api/services/candidateImportService"
import { fileService } from "@/api/services/fileService"
import { staffService } from "@/api/services/staffService"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/AuthContext"

export default function ResumeZipUploader({ onImportComplete }) {
  const { user } = useAuth()

  const [uploading, setUploading] = useState(false)

  const [zipFile, setZipFile] = useState(null)

  const [parseError, setParseError] = useState(null)

  const [parseResults, setParseResults] = useState(null)

  const [recruiterId, setRecruiterId] = useState("")

  const [employerId, setEmployerId] = useState("")

  const [importSource, setImportSource] = useState("linkedin")

  const [initialStatus, setInitialStatus] = useState("new")

  const [validationResults, setValidationResults] = useState(null)

  // Fetch staff members for dropdown
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const result = await staffService.list({ sort: "created_date", order: "DESC", limit: 1000 })

      return result || []
    },
  })

  const handleZipSelect = (file) => {
    if (file && file.name.endsWith(".zip")) {
      setZipFile(file)
      setParseError(null)
    } else {
      setParseError("נא בחר קובץ ZIP")
    }
  }

  const handleUploadAndParse = async () => {
    if (!zipFile) {
      return
    }

    setUploading(true)
    setParseError(null)

    try {
      // 1. Upload ZIP file
      const uploadResult = await fileService.upload(zipFile)

      const zipUrl = uploadResult.file_url

      // 2. Create import batch record
      const importBatch = await candidateImportService.create({
        batch_name: zipFile.name.replace(".zip", ""),
        source_file: zipUrl,
        file_type: "zip",
        recruiter_id: recruiterId || user?.id,
        team_manager_id: user?.role === "team_manager" ? user.id : user?.team_manager_id,
        recruitment_manager_id: user?.recruitment_manager_id,
        employer_id: employerId || null,
        total_records: 0,
      })

      // 3. Parse resume batch
      const parseResult = await candidateImportService.parseBatch({
        zip_file_url: zipUrl,
        import_batch_id: importBatch.id,
        employer_id: employerId || null,
        recruiter_id: recruiterId || null,
        source: importSource,
        initial_status: initialStatus,
      })

      // 4. Show review screen
      setParseResults({
        ...parseResult,
        importBatchId: importBatch.id,
        zipUrl,
        recruiterId,
        employerId,
      })
    } catch (err) {
      console.error("[ResumeZipUploader] Error:", err)
      setParseError(err.message || "שגיאה בעיבוד ZIP")
    } finally {
      setUploading(false)
    }
  }

  if (validationResults) {
    return (
      <ImportValidationCheck
        results={validationResults}
        onApprove={() => {
          setValidationResults(null)
          onImportComplete?.()
        }}
        onBack={() => setValidationResults(null)}
      />
    )
  }

  if (parseResults) {
    return (
      <ResumeImportReview
        results={parseResults}
        onComplete={async () => {
          // Run validation after candidates created
          try {
            const validation = await candidateImportService.validateBatch(
              parseResults.importBatchId,
            )

            setValidationResults(validation)
          } catch (err) {
            console.error("Validation failed:", err)
            setParseResults(null)
            setZipFile(null)
            onImportComplete?.()
          }
        }}
        onBack={() => setParseResults(null)}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm" dir="rtl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">העלאת ZIP עם קורות חיים</h2>

      {/* File Upload */}
      <label className="block border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all mb-6">
        <input
          type="file"
          accept=".zip"
          onChange={(e) => handleZipSelect(e.target.files?.[0])}
          disabled={uploading}
          className="hidden"
        />

        <Upload className="w-8 h-8 mx-auto text-purple-500 mb-3" />

        <p className="text-base font-medium text-gray-900">בחר קובץ ZIP</p>

        <p className="text-sm text-gray-500 mt-1">תמוך ב: PDF, DOC, DOCX, TXT</p>
      </label>

      {zipFile && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{zipFile.name}</p>

            <p className="text-xs text-gray-500">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          <button onClick={() => setZipFile(null)} className="text-gray-500 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {parseError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

          <p className="text-sm text-red-700">{parseError}</p>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">מקור</label>

          <select
            value={importSource}
            onChange={(e) => setImportSource(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="linkedin">LinkedIn Campaign</option>

            <option value="email">אימייל</option>

            <option value="manual">ידנית</option>

            <option value="crawl">Crawl</option>

            <option value="other">אחר</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס התחלתי</label>

          <select
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="new">מועמד חדש</option>

            <option value="contacted">יצור קשר</option>

            <option value="interview">ראיון</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">מגייס (אופציונלי)</label>

          <select
            value={recruiterId}
            onChange={(e) => setRecruiterId(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">לא נבחר</option>

            {staffMembers
              .filter((s) => s.role === "recruiter")
              .map((member) => (
                <option key={member.id} value={member.email}>
                  {member.full_name} ({member.email})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">מעסיק (אופציונלי)</label>

          <select
            value={employerId}
            onChange={(e) => setEmployerId(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">לא נבחר</option>

            {staffMembers
              .filter((s) => s.role === "hiring_manager")
              .map((member) => (
                <option key={member.id} value={member.email}>
                  {member.full_name} ({member.email})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleUploadAndParse}
        disabled={!zipFile || uploading}
        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            עיבוד בטעינה...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            בדוק ותהליך ZIP
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        המערכת תחלץ נתונים, תבדוק כפילויות, ותציג סיכום לפני יצירת מועמדים
      </p>
    </div>
  )
}
import { Upload, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import ResumeImportReview from "./ResumeImportReview"
import ImportValidationCheck from "./ImportValidationCheck"
