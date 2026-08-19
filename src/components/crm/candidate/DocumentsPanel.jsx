import { useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"

const DOC_COLORS = {
  cv: "#7C3AED",
  cover_letter: "#2563EB",
  portfolio: "#10B981",
  certificate: "#F59E0B",
  contract: "#EF4444",
  id: "#64748B",
  other: "#94A3B8",
}

function formatBytes(bytes) {
  if (!bytes) {
    return ""
  }

  if (bytes < 1024) {
    return `${bytes}B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function DocumentsPanel({ documents, candidate, onUpload }) {
  const { t } = useTranslation()

  const { can } = usePermissionMatrix()

  const canUpdate = can("update")

  const canDownload = can("download_cv")

  const DOC_TYPE_LABELS = {
    cv: t("candidateCRM.documents.types.cv"),
    cover_letter: t("candidateCRM.documents.types.cover_letter"),
    portfolio: t("candidateCRM.documents.types.portfolio"),
    certificate: t("candidateCRM.documents.types.certificate"),
    contract: t("candidateCRM.documents.types.contract"),
    id: t("candidateCRM.documents.types.id"),
    other: t("candidateCRM.documents.types.other"),
  }

  const [uploading, setUploading] = useState(false)

  const [docType, setDocType] = useState("cv")

  const fileRef = useRef()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    await onUpload(file, docType)
    setUploading(false)
    e.target.value = ""
  }

  const grouped = Object.entries(DOC_TYPE_LABELS).reduce((acc, [type]) => {
    const docs = documents.filter((d) => d.doc_type === type)

    if (docs.length) {
      acc[type] = docs
    }

    return acc
  }, {})

  // Also include CV from candidate entity (email intake uses resume_url directly)
  const hasResumeEntity =
    candidate?.original_resume_url || candidate?.converted_resume_url || candidate?.resume_url

  return (
    <div>
      {/* Upload */}
      {canUpdate && (
        <div className="flex items-center gap-2 mb-4">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="text-xs font-semibold border border-[#E4ECFF] rounded-lg px-3 py-2 bg-white text-[#1F2937] flex-1"
          >
            {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs gap-1.5 h-9"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading
              ? t("candidateCRM.documents.uploading")
              : t("candidateCRM.documents.uploadFile")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Entity CV */}
      {hasResumeEntity && (
        <div className="mb-4">
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">
            {t("candidateCRM.documents.fromSystem")}
          </div>
          <div className="space-y-2">
            {(candidate.original_resume_url ||
              (!candidate.converted_resume_url && candidate.resume_url)) && (
              <DocRow
                doc={{
                  filename:
                    candidate.original_resume_filename || candidate.resume_filename || "קורות חיים",
                  file_url: candidate.original_resume_url || candidate.resume_url,
                  doc_type: "cv",
                }}
                color={DOC_COLORS.cv}
                canDownload={canDownload}
              />
            )}
            {candidate.converted_resume_url && (
              <DocRow
                doc={{
                  filename: candidate.converted_resume_filename || "קורות חיים DOCX",
                  file_url: candidate.converted_resume_url,
                  doc_type: "cv",
                }}
                color={DOC_COLORS.cv}
                badge="DOCX"
                canDownload={canDownload}
              />
            )}
          </div>
        </div>
      )}

      {/* Uploaded Docs */}
      {Object.keys(grouped).length === 0 && !hasResumeEntity && (
        <div className="text-center py-10 text-[#94A3B8]">
          <File className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">{t("candidateCRM.documents.noDocuments")}</p>
          <p className="text-xs mt-1">{t("candidateCRM.documents.uploadToStart")}</p>
        </div>
      )}

      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type} className="mb-4">
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">
            {DOC_TYPE_LABELS[type]}
          </div>
          <div className="space-y-2">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                color={DOC_COLORS[doc.doc_type] || "#94A3B8"}
                canDownload={canDownload}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DocRow({ doc, color, badge, canDownload }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E4ECFF] px-4 py-3 group">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <FileText className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1F2937] truncate">{doc.filename}</span>
          {badge && (
            <span className="text-xs bg-[#EEF4FF] text-[#4F46E5] font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {doc.file_size && (
          <span className="text-xs text-[#94A3B8]">{formatBytes(doc.file_size)}</span>
        )}
      </div>
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <a href={doc.file_url} target="_blank" rel="noreferrer">
          <button className="p-1.5 rounded-lg hover:bg-[#EEF4FF] text-[#94A3B8] hover:text-[#7C3AED] transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </a>
        {canDownload && (
          <a href={doc.file_url} download>
            <button className="p-1.5 rounded-lg hover:bg-[#EEF4FF] text-[#94A3B8] hover:text-[#7C3AED] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </a>
        )}
      </div>
    </div>
  )
}
