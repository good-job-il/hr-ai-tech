import { useState } from "react"
import { candidateService } from "@/api/services/candidateService"
import { useQuery } from "@tanstack/react-query"

const CandidateVerification = () => {
  const [selectedStatus, setSelectedStatus] = useState("all")

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["all-candidates"],
    queryFn: async () => {
      const result = await candidateService.list({
        sort: "created_date",
        order: "DESC",
        limit: 1000,
      })

      return result || []
    },
  })

  const stats = {
    total: candidates.length,
    withEmail: candidates.filter((c) => c.email).length,
    withPhone: candidates.filter((c) => c.phone).length,
    withDomain: candidates.filter((c) => c.domain_name).length,
    withRole: candidates.filter((c) => c.role_name).length,
    withResume: candidates.filter((c) => c.resume_url).length,
    withConvertedResume: candidates.filter((c) => c.converted_resume_url).length,
    missingEmail: candidates.filter((c) => !c.email).length,
    missingPhone: candidates.filter((c) => !c.phone).length,
    missingDomain: candidates.filter((c) => !c.domain_name).length,
    missingRole: candidates.filter((c) => !c.role_name).length,
    missingResume: candidates.filter((c) => !c.resume_url).length,
    missingConvertedResume: candidates.filter((c) => !c.converted_resume_url).length,
    suspectedDuplicates: candidates.filter((c) => c.is_duplicate_suspected).length,
    withoutRecruiter: candidates.filter((c) => !c.recruiter_id).length,
    parsingFailed: candidates.filter((c) => c.parsing_status === "failed").length,
    conversionFailed: candidates.filter((c) => c.conversion_status === "failed").length,
  }

  const dataQualityScore =
    candidates.length > 0
      ? Math.round(
          ((stats.withEmail / stats.total) * 0.2 +
            (stats.withPhone / stats.total) * 0.2 +
            (stats.withDomain / stats.total) * 0.2 +
            (stats.withRole / stats.total) * 0.2 +
            (stats.withResume / stats.total) * 0.2) *
            100,
        )
      : 0

  const filtered = candidates.filter((c) => {
    switch (selectedStatus) {
      case "missing_email":
        return !c.email
      case "missing_phone":
        return !c.phone
      case "missing_domain":
        return !c.domain_name
      case "missing_role":
        return !c.role_name
      case "missing_resume":
        return !c.resume_url
      case "duplicates":
        return c.is_duplicate_suspected
      case "no_recruiter":
        return !c.recruiter_id
      default:
        return true
    }
  })

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        <h1 className="text-3xl font-bold text-gray-900">בדיקת איכות מועמדים</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 text-sm font-medium">סה״כ מועמדים</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.total.toLocaleString("he-IL")}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 text-sm font-medium">DOCX מומרים</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.withConvertedResume}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.missingConvertedResume} בטיפול</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 text-sm font-medium">ניקוד איכות</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold text-green-600">{dataQualityScore}%</p>
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 text-sm font-medium">שגיאות parsing</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.parsingFailed}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <p className="text-gray-600 text-sm font-medium">כפילויות</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-3xl font-bold text-red-600">{stats.suspectedDuplicates}</p>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Data Completeness Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">שלמות נתונים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "אימייל",
                have: stats.withEmail,
                missing: stats.missingEmail,
                status: "email",
              },
              {
                label: "טלפון",
                have: stats.withPhone,
                missing: stats.missingPhone,
                status: "phone",
              },
              {
                label: "תחום",
                have: stats.withDomain,
                missing: stats.missingDomain,
                status: "domain",
              },
              { label: "תפקיד", have: stats.withRole, missing: stats.missingRole, status: "role" },
              {
                label: "קורות חיים",
                have: stats.withResume,
                missing: stats.missingResume,
                status: "resume",
              },
              {
                label: "DOCX מומר",
                have: stats.withConvertedResume,
                missing: stats.missingConvertedResume,
                status: "converted_resume",
              },
              {
                label: "מגייס",
                have: stats.total - stats.withoutRecruiter,
                missing: stats.withoutRecruiter,
                status: "recruiter",
              },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() =>
                  setSelectedStatus(item.missing > 0 ? `missing_${item.status}` : "all")
                }
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-violet-600"
                      style={{ width: `${(item.have / stats.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 w-12 text-right">
                    {Math.round((item.have / stats.total) * 100)}%
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {item.have} / {stats.total}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Candidate List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">מועמדים ({filtered.length})</h2>
            {selectedStatus !== "all" && (
              <button
                onClick={() => setSelectedStatus("all")}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                ראה הכל
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">טוען...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-center py-8">אין מועמדים לתצוגה</p>
            ) : (
              filtered.slice(0, 50).map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{candidate.full_name}</p>
                      {candidate.parsing_confidence && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            candidate.parsing_confidence >= 80
                              ? "bg-green-100 text-green-700"
                              : candidate.parsing_confidence >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {candidate.parsing_confidence}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap text-xs text-gray-600 mt-1">
                      {!candidate.email && <span className="text-red-600">❌ אין אימייל</span>}
                      {!candidate.phone && <span className="text-red-600">❌ אין טלפון</span>}
                      {!candidate.domain_name && (
                        <span className="text-orange-600">⚠ אין תחום</span>
                      )}
                      {!candidate.role_name && <span className="text-orange-600">⚠ אין תפקיד</span>}
                      {!candidate.resume_url && <span className="text-orange-600">⚠ אין קו"ח</span>}
                      {!candidate.converted_resume_url && (
                        <span className="text-blue-600">⚙️ DOCX בטיפול</span>
                      )}
                      {candidate.conversion_status === "failed" && (
                        <span className="text-red-600">❌ המרה נכשלה</span>
                      )}
                      {candidate.parsing_status === "failed" && (
                        <span className="text-red-600">❌ parsing נכשל</span>
                      )}
                      {candidate.is_duplicate_suspected && (
                        <span className="text-red-600">🔄 כפילות חשודה</span>
                      )}
                      {candidate.review_required && (
                        <span className="text-orange-600">👁 דורש ביקורת</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default CandidateVerification
