import { useState } from "react"
import { candidateImportService } from "@/api/services/candidateImportService"

export default function ResumeImportReview({ results, onComplete, onBack }) {
  const [importing, setImporting] = useState(false)

  const [importError, setImportError] = useState(null)

  const [resolvedDuplicates, setResolvedDuplicates] = useState({})

  const [selectedDuplicate, setSelectedDuplicate] = useState(null)

  const handleResolveDuplicate = (duplicateIndex, action, mergeWithId) => {
    setResolvedDuplicates((prev) => ({
      ...prev,
      [duplicateIndex]: { action, mergeWithId },
    }))
    setSelectedDuplicate(null)
  }

  const handleCreateCandidates = async () => {
    setImporting(true)
    setImportError(null)

    try {
      // Filter out duplicates that weren't resolved for creation
      const candidatesToCreate = results.candidates.filter((_, idx) => {
        const resolved = resolvedDuplicates[idx]

        return !resolved || resolved.action === "create_anyway"
      })

      if (candidatesToCreate.length === 0) {
        setImportError("אין מועמדים ליצירה")
        setImporting(false)

        return
      }

      // Create bulk candidates
      const createResult = await candidateImportService.createBulk(
        candidatesToCreate.map((c) => c.data),
        results.importBatchId,
      )

      onComplete?.()
    } catch (err) {
      console.error("[ResumeImportReview] Error:", err)
      setImportError(err.message || "שגיאה ביצירת מועמדים")
    } finally {
      setImporting(false)
    }
  }

  const totalToCreate = results.candidates.filter((_, idx) => {
    const resolved = resolvedDuplicates[idx]

    return !resolved || resolved.action === "create_anyway"
  }).length

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>

        <h2 className="text-2xl font-bold text-gray-900">בדיקה של קורות חיים</h2>

        <p className="text-gray-600 mt-2">בדוק את הנתונים שהוצאו ופתור כפילויות לפני יצירה</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">סה״כ resumes</p>

          <p className="text-2xl font-bold text-gray-900">{results.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">עובדו בהצלחה</p>

          <p className="text-2xl font-bold text-green-600">{results.processed}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">כפילויות</p>

          <p className="text-2xl font-bold text-yellow-600">{results.duplicates.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">נכשלו</p>

          <p className="text-2xl font-bold text-red-600">{results.failed}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-1">ליצירה</p>

          <p className="text-2xl font-bold text-purple-600">{totalToCreate}</p>
        </div>
      </div>

      {importError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

          <p className="text-sm text-red-700">{importError}</p>
        </div>
      )}

      {/* Duplicates */}
      {results.duplicates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">כפילויות שנמצאו</h3>

          <div className="space-y-3">
            {results.duplicates.map((dup, idx) => (
              <div key={idx} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{dup.extracted.full_name}</p>

                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      {dup.extracted.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />

                          {dup.extracted.email}
                        </span>
                      )}

                      {dup.extracted.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />

                          {dup.extracted.phone}
                        </span>
                      )}

                      {dup.extracted.role_name && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />

                          {dup.extracted.role_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-yellow-700 mt-2">
                      ⚠️ קיים כבר: {dup.existingCandidate.full_name} ({dup.reason})
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedDuplicate(idx)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    החלט
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates to Create */}
      {results.candidates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            מועמדים ליצירה ({totalToCreate}/{results.candidates.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.candidates.map((candidate, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{candidate.data.full_name}</p>

                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    {candidate.data.email && <span>{candidate.data.email}</span>}

                    {candidate.data.phone && <span>{candidate.data.phone}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                    <span>איכות: {candidate.data.data_quality_score}%</span>

                    <span>ביטחון: {candidate.data.parsing_confidence}%</span>

                    {candidate.data.review_required && (
                      <span className="text-orange-600 font-medium">⚠️ דורש ביקורת</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {results.errors.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            קובצים שנכשלו ({results.errors.length})
          </h3>

          <div className="space-y-2">
            {results.errors.map((err, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />

                <div>
                  <p className="font-medium text-red-900">{err.filename}</p>

                  <p className="text-xs text-red-700">{err.error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-2xl">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
        >
          ביטול
        </button>

        <button
          onClick={handleCreateCandidates}
          disabled={importing || totalToCreate === 0}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {importing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              יצירה בטעינה...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              יצור {totalToCreate} מועמדים
            </>
          )}
        </button>
      </div>

      {/* Duplicate Modal */}
      {selectedDuplicate !== null && (
        <DuplicateResolveModal
          duplicate={results.duplicates[selectedDuplicate]}
          onResolve={(action, mergeId) => {
            handleResolveDuplicate(selectedDuplicate, action, mergeId)
          }}
          onClose={() => setSelectedDuplicate(null)}
        />
      )}
    </div>
  )
}
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react"
import DuplicateResolveModal from "./DuplicateResolveModal"
